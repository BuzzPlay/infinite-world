# Local Runner

`local_generator.py` is the GPU-side adapter for local video generation. It
reads one JSON object per line from stdin and writes one JSON object per line
to stdout. Logs always go to stderr so the API can parse stdout safely.

Install the Python dependencies in a GPU virtual environment, then configure
the service before starting a local run:

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -r runners/requirements.txt
export INFINITE_WORLD_LOCAL_GENERATOR="python runners/local_generator.py"
```

The model weights are downloaded lazily on the first request. Set
`INFINITE_WORLD_LTXV1_MODEL_DIR` or `INFINITE_WORLD_LTX23_MODEL_DIR` to local
weight directories when the host should not download from the model hub.

Supported local model values are `ltxv1`, `ltx-2.3-local`, and
`ltx-2.3-condition`. The latter accepts up to four character references. LTX
2.3 audio is returned as stereo 16-bit PCM at 44.1 kHz when the model produces
audio and the request enables it.
