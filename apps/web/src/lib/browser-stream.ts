import { websocketUrl } from './api-url';

export type BrowserStreamState = 'connecting' | 'connected' | 'closed' | 'error';

export interface BrowserStreamConnection {
  close: () => void;
}

interface BrowserSignal {
  type: 'ready' | 'answer' | 'error';
  sdp?: string;
  message?: string;
}

export function connectBrowserStream(
  worldId: string,
  video: HTMLVideoElement,
  onState: (state: BrowserStreamState) => void,
): Promise<BrowserStreamConnection> {
  const socket = new WebSocket(websocketUrl(`/api/worlds/${worldId}/run/webrtc`));
  let peer: RTCPeerConnection | null = null;
  let closed = false;

  const cleanup = () => {
    peer?.close();
    peer = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    video.srcObject = null;
  };

  const close = () => {
    if (closed) return;
    closed = true;
    cleanup();
    onState('closed');
  };

  const fail = (error: Error) => {
    if (closed) return;
    closed = true;
    onState('error');
    void error;
    cleanup();
  };

  const waitForIceGathering = async (nextPeer: RTCPeerConnection) => {
    if (nextPeer.iceGatheringState === 'complete') return;
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        nextPeer.removeEventListener('icegatheringstatechange', handleStateChange);
        window.clearTimeout(timeout);
        resolve();
      };
      const handleStateChange = () => {
        if (nextPeer.iceGatheringState === 'complete') finish();
      };
      const timeout = window.setTimeout(finish, 5_000);
      nextPeer.addEventListener('icegatheringstatechange', handleStateChange);
    });
  };

  const negotiate = async () => {
    try {
      const nextPeer = new RTCPeerConnection();
      peer = nextPeer;
      nextPeer.addTransceiver('video', { direction: 'recvonly' });
      nextPeer.addTransceiver('audio', { direction: 'recvonly' });
      nextPeer.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        video.srcObject = stream;
        void video.play().catch(() => undefined);
        onState('connected');
      };
      nextPeer.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(nextPeer.connectionState)) {
          onState(nextPeer.connectionState === 'closed' ? 'closed' : 'error');
        }
      };
      nextPeer.onicecandidate = (event) => {
        if (event.candidate && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate.toJSON() }));
        }
      };
      const offer = await nextPeer.createOffer();
      await nextPeer.setLocalDescription(offer);
      await waitForIceGathering(nextPeer);
      const localDescription = nextPeer.localDescription;
      if (!localDescription || socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebRTC signaling is not available');
      }
      socket.send(JSON.stringify({ type: 'offer', sdp: localDescription.sdp }));
    } catch (error) {
      fail(error instanceof Error ? error : new Error('WebRTC negotiation failed'));
    }
  };

  socket.onopen = () => onState('connecting');
  socket.onmessage = (event) => {
    let signal: BrowserSignal;
    try {
      signal = JSON.parse(event.data) as BrowserSignal;
    } catch {
      fail(new Error('WebRTC signaling returned invalid data'));
      return;
    }
    if (signal.type === 'ready') {
      void negotiate();
    } else if (signal.type === 'answer' && signal.sdp && peer) {
      void peer.setRemoteDescription({ type: 'answer', sdp: signal.sdp }).catch((error) => {
        fail(error instanceof Error ? error : new Error('WebRTC answer was rejected'));
      });
    } else if (signal.type === 'error') {
      fail(new Error(signal.message || 'Browser output is unavailable'));
    }
  };
  socket.onerror = () => fail(new Error('WebRTC signaling connection failed'));
  socket.onclose = () => {
    if (!closed) {
      closed = true;
      peer?.close();
      peer = null;
      video.srcObject = null;
      onState('closed');
    }
  };

  onState('connecting');
  return Promise.resolve({ close });
}
