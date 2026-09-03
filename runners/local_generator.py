#!/usr/bin/env python3
"""NDJSON adapter for the local video generation pipelines.

The API owns orchestration, persistence, and streaming. This process
owns the GPU model and deliberately communicates through one JSON object per
line so it can be replaced without changing the service API.
"""

from __future__ import annotations

import base64
import json
import os
import random
import sys
import time
from io import BytesIO
from typing import Any
from urllib.request import Request, urlopen

from PIL import Image


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def value_or_default(value: Any, default: Any) -> Any:
    return default if value is None else value


def decode_image(value: str) -> Image.Image:
    value = (value or "").strip()
    if not value:
        raise ValueError("an input image is required for local generation")
    if value.startswith("http://") or value.startswith("https://"):
        request = Request(value, headers={"User-Agent": "infinite-world-local-runner"})
        with urlopen(request, timeout=30) as response:
            value = base64.b64encode(response.read()).decode("ascii")
    if value.startswith("data:"):
        try:
            _, value = value.split(",", 1)
        except ValueError as error:
            raise ValueError("image data URL is missing its payload") from error
    try:
        image = Image.open(BytesIO(base64.b64decode(value, validate=True))).convert("RGB")
    except Exception as error:
        raise ValueError(f"could not decode input image: {error}") from error
    return image


def image_base64(image: Image.Image) -> str:
    output = BytesIO()
    image.save(output, format="JPEG", quality=92, optimize=True)
    return base64.b64encode(output.getvalue()).decode("ascii")


def audio_to_pcm(audio: Any, source_rate: int) -> str | None:
    if audio is None:
        return None
    import torch
    import torchaudio.functional as audio_functional

    if audio.dim() == 3:
        audio = audio[0]
    audio = audio.detach().to(torch.float32).cpu()
    if audio.ndim != 2 or audio.shape[1] == 0:
        return None
    if audio.shape[0] == 1:
        audio = audio.repeat(2, 1)
    elif audio.shape[0] > 2:
        audio = audio[:2]
    if source_rate != 44100:
        audio = audio_functional.resample(audio, source_rate, 44100)
    samples = (audio.clamp(-1.0, 1.0) * 32767.0).to(torch.int16)
    interleaved = samples.transpose(0, 1).contiguous().numpy().tobytes()
    return base64.b64encode(interleaved).decode("ascii")


def model_source(environment_name: str, default: str) -> str:
    return os.environ.get(environment_name, default)


class LocalGenerator:
    def __init__(self) -> None:
        self.device = os.environ.get("INFINITE_WORLD_DEVICE", "cuda")
        self.dtype_name = os.environ.get("INFINITE_WORLD_DTYPE", "bfloat16")
        self.pipeline_v1 = None
        self.pipeline_v23 = None
        self.pipeline_condition = None
        self.audio_sample_rate = 24000

    def validate_runtime(self, model: str, request: dict[str, Any]) -> None:
        """Fail at the runner boundary with an actionable environment error."""
        if model not in {"ltxv1", "ltx-2.3-local", "ltx-2.3-condition"}:
            raise ValueError(f"unsupported local model: {model}")

        try:
            import torch
        except ImportError as error:
            raise RuntimeError("local generation requires PyTorch; install runners/requirements.txt") from error

        device = self.device.lower()
        if device.startswith("cuda"):
            if not torch.cuda.is_available():
                raise RuntimeError(
                    "INFINITE_WORLD_DEVICE is set to CUDA, but CUDA is unavailable; "
                    "install a CUDA PyTorch build or set INFINITE_WORLD_DEVICE=cpu"
                )
        elif device == "mps":
            if not getattr(torch.backends, "mps", None) or not torch.backends.mps.is_available():
                raise RuntimeError(
                    "INFINITE_WORLD_DEVICE=mps is unavailable; use cpu or a working Apple GPU runtime"
                )
        elif device != "cpu":
            raise RuntimeError(
                f"unsupported INFINITE_WORLD_DEVICE={self.device!r}; use cuda, mps, or cpu"
            )

        if self.dtype_name not in {"bfloat16", "float16", "float32"}:
            raise RuntimeError(
                f"unsupported INFINITE_WORLD_DTYPE={self.dtype_name!r}; "
                "use bfloat16, float16, or float32"
            )
        if not hasattr(torch, self.dtype_name):
            raise RuntimeError(f"PyTorch does not provide dtype {self.dtype_name}")

        try:
            import diffusers  # noqa: F401
        except ImportError as error:
            raise RuntimeError(
                "local generation requires diffusers; install runners/requirements.txt"
            ) from error

        self.validate_request(model, request)

    @staticmethod
    def validate_request(model: str, request: dict[str, Any]) -> None:
        width = int(value_or_default(request.get("width"), 512))
        height = int(value_or_default(request.get("height"), 384))
        if not 256 <= width <= 4096 or not 144 <= height <= 4096:
            raise ValueError("width must be 256-4096 and height must be 144-4096")
        if width % 32 or height % 32:
            raise ValueError("width and height must be divisible by 32")

        frames = int(value_or_default(request.get("num_frames"), 121))
        if not 9 <= frames <= 1001 or frames % 8 != 1:
            raise ValueError("num_frames must be between 9 and 1001 and equal 8*k + 1")

        frame_rate = float(value_or_default(request.get("frame_rate"), 9.0))
        if not 1.0 <= frame_rate <= 60.0:
            raise ValueError("frame_rate must be between 1 and 60")

        if not (request.get("image_base64") or request.get("image_url")):
            raise ValueError(f"{model} requires an initial image")

        stg_scale = float(request.get("stg_scale") or 0)
        if stg_scale > 0 and not request.get("spatio_temporal_guidance_blocks"):
            raise ValueError("spatio_temporal_guidance_blocks are required when stg_scale is enabled")

        references = request.get("character_refs") or []
        if len(references) > 4:
            raise ValueError("character_refs cannot contain more than four references")

    def dtype(self):
        import torch

        return getattr(torch, self.dtype_name)

    def load_v1(self):
        if self.pipeline_v1 is not None:
            return self.pipeline_v1
        from diffusers import LTXConditionPipeline

        source = model_source(
            "INFINITE_WORLD_LTXV1_MODEL_DIR",
            "Lightricks/LTX-Video-0.9.8-13B-distilled",
        )
        log(f"loading local v1 pipeline from {source}")
        pipeline = LTXConditionPipeline.from_pretrained(
            source,
            torch_dtype=self.dtype(),
            use_safetensors=True,
        )
        pipeline.to(self.device)
        if hasattr(pipeline, "vae") and hasattr(pipeline.vae, "enable_tiling"):
            pipeline.vae.enable_tiling()
        self.pipeline_v1 = pipeline
        return pipeline

    def load_v23(self):
        if self.pipeline_v23 is not None:
            return self.pipeline_v23
        from diffusers import AutoModel, LTX2ImageToVideoPipeline

        source = model_source(
            "INFINITE_WORLD_LTX23_MODEL_DIR",
            "dg845/LTX-2.3-Distilled-Diffusers",
        )
        log(f"loading local v2.3 pipeline from {source}")
        transformer = AutoModel.from_pretrained(
            source,
            subfolder="transformer",
            torch_dtype=self.dtype(),
        )
        if self.device.lower().startswith("cuda") and hasattr(transformer, "enable_layerwise_casting"):
            import torch

            transformer.enable_layerwise_casting(
                storage_dtype=torch.float8_e4m3fn,
                compute_dtype=self.dtype(),
            )
        pipeline = LTX2ImageToVideoPipeline.from_pretrained(
            source,
            transformer=transformer,
            torch_dtype=self.dtype(),
        )
        pipeline.to(self.device)
        self.pipeline_v23 = pipeline
        self.audio_sample_rate = int(
            getattr(getattr(pipeline, "vocoder", None), "config", None)
            and getattr(pipeline.vocoder.config, "output_sampling_rate", 24000)
            or 24000
        )
        return pipeline

    def load_condition(self):
        if self.pipeline_condition is not None:
            return self.pipeline_condition
        pipeline = self.load_v23()
        from diffusers import LTX2ConditionPipeline

        log("loading local v2.3 condition pipeline")
        condition = LTX2ConditionPipeline(
            transformer=pipeline.transformer,
            vae=pipeline.vae,
            text_encoder=pipeline.text_encoder,
            tokenizer=pipeline.tokenizer,
            connectors=pipeline.connectors,
            scheduler=pipeline.scheduler,
            vocoder=pipeline.vocoder,
            audio_vae=pipeline.audio_vae,
        )
        condition.to(self.device)
        self.pipeline_condition = condition
        return condition

    def generate(self, request: dict[str, Any]) -> dict[str, Any]:
        model = request.get("model_type", "ltxv1")
        self.validate_runtime(model, request)
        if model == "ltxv1":
            frames, audio = self.generate_v1(request)
        elif model == "ltx-2.3-local":
            frames, audio = self.generate_v23(request)
        elif model == "ltx-2.3-condition":
            frames, audio = self.generate_condition(request)
        else:
            raise ValueError(f"unsupported local model: {model}")

        response: dict[str, Any] = {
            "media_type": "video",
            "frame_mime_type": "image/jpeg",
            "frames": [image_base64(frame) for frame in frames],
        }
        if audio and value_or_default(request.get("enable_audio"), True):
            response.update(
                {
                    "audio_pcm": audio,
                    "audio_mime_type": "audio/pcm",
                    "audio_sample_rate": 44100,
                    "audio_channels": 2,
                }
            )
        return response

    def prepare_image(self, request: dict[str, Any]) -> Image.Image:
        image = decode_image(request.get("image_base64") or request.get("image_url", ""))
        width = int(value_or_default(request.get("width"), 512))
        height = int(value_or_default(request.get("height"), 384))
        return image.resize((width, height), Image.Resampling.LANCZOS)

    def common_v23_kwargs(self, request: dict[str, Any]) -> dict[str, Any]:
        import torch
        from diffusers.pipelines.ltx2.utils import DISTILLED_SIGMA_VALUES

        seed = request.get("seed")
        seed = int(seed) if seed is not None else random.randrange(2**31)
        steps = 8
        kwargs: dict[str, Any] = {
            "prompt": request.get("prompt", ""),
            "negative_prompt": request.get("negative_prompt", ""),
            "width": int(value_or_default(request.get("width"), 512)),
            "height": int(value_or_default(request.get("height"), 384)),
            "num_frames": int(value_or_default(request.get("num_frames"), 121)),
            "frame_rate": float(value_or_default(request.get("frame_rate"), 9.0)),
            "num_inference_steps": steps,
            "sigmas": DISTILLED_SIGMA_VALUES,
            "guidance_scale": float(value_or_default(request.get("guidance_scale"), 3.0)),
            "modality_scale": 1.0,
            "generator": torch.Generator(device=self.device).manual_seed(seed),
            "output_type": "pil",
            "return_dict": False,
        }
        noise = request.get("noise_scale")
        if noise is not None:
            kwargs["noise_scale"] = float(noise)
        blocks = request.get("spatio_temporal_guidance_blocks")
        if float(request.get("stg_scale") or 0) > 0 and blocks:
            kwargs["stg_scale"] = float(request["stg_scale"])
            kwargs["spatio_temporal_guidance_blocks"] = [int(block) for block in blocks]
        return kwargs

    def generate_v23(self, request: dict[str, Any]):
        pipeline = self.load_v23()
        kwargs = self.common_v23_kwargs(request)
        kwargs["image"] = self.prepare_image(request)
        log(f"generating local v2.3 scene {request.get('sequence', '?')}")
        video, audio = pipeline(**kwargs)
        if not video:
            raise RuntimeError("local v2.3 pipeline returned no video frames")
        return video[0], audio_to_pcm(audio, self.audio_sample_rate)

    def generate_condition(self, request: dict[str, Any]):
        from diffusers.pipelines.ltx2.pipeline_ltx2_condition import LTX2VideoCondition

        pipeline = self.load_condition()
        kwargs = self.common_v23_kwargs(request)
        image = self.prepare_image(request)
        conditions = [LTX2VideoCondition(frames=image, index=0, strength=1.0)]
        for reference in (request.get("character_refs") or [])[:4]:
            try:
                reference_image = decode_image(reference.get("image", ""))
                reference_image = reference_image.resize(image.size, Image.Resampling.LANCZOS)
                conditions.append(
                    LTX2VideoCondition(
                        frames=reference_image,
                        index=0,
                        strength=float(reference.get("strength", 0.4)),
                    )
                )
            except Exception as error:
                log(f"skipping invalid character reference: {error}")
        kwargs.pop("image", None)
        kwargs["conditions"] = conditions
        kwargs.pop("noise_scale", None)
        log(f"generating conditioned scene with {len(conditions)} image conditions")
        video, audio = pipeline(**kwargs)
        if not video:
            raise RuntimeError("local condition pipeline returned no video frames")
        return video[0], audio_to_pcm(audio, self.audio_sample_rate)

    def generate_v1(self, request: dict[str, Any]):
        import torch

        pipeline = self.load_v1()
        image = self.prepare_image(request)
        seed = request.get("seed")
        generator = torch.Generator(device=self.device)
        generator.manual_seed(int(seed) if seed is not None else random.randrange(2**31))
        kwargs = {
            "image": image,
            "prompt": request.get("prompt", ""),
            "negative_prompt": request.get("negative_prompt", ""),
            "width": image.width,
            "height": image.height,
            "num_frames": int(value_or_default(request.get("num_frames"), 121)),
            "timesteps": request.get("timesteps") or [1000, 993, 987, 981, 975, 909, 725, 0.03],
            "strength": float(value_or_default(request.get("strength"), 1.0)),
            "guidance_scale": float(value_or_default(request.get("guidance_scale"), 3.0)),
            "generator": generator,
            "output_type": "pil",
        }
        log(f"generating local v1 scene {request.get('sequence', '?')}")
        result = pipeline(**kwargs)
        if not getattr(result, "frames", None):
            raise RuntimeError("local v1 pipeline returned no video frames")
        return result.frames[0], None


def process_request(generator: LocalGenerator, request: dict[str, Any]) -> dict[str, Any]:
    started = time.monotonic()
    response = generator.generate(request)
    response["generation_latency_ms"] = int((time.monotonic() - started) * 1000)
    return response


def main() -> None:
    generator = LocalGenerator()
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise ValueError("request must be a JSON object")
            response = process_request(generator, request)
            print(json.dumps(response, separators=(",", ":")), flush=True)
        except Exception as error:
            log(f"generation request failed: {error}")
            print(json.dumps({"error": str(error)}, separators=(",", ":")), flush=True)


if __name__ == "__main__":
    main()
