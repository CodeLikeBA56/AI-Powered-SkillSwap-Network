class PeerService {
  constructor() {
    this.peers = {};
  }

  createPeerConnection(remoteUserId, userId, onTrackEvent, onNegotiation, onICECandidateEvent) {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] }
      ]
    });

    // peer.addTransceiver('audio', { direction: 'sendrecv' });
    // peer.addTransceiver('video', { direction: 'sendrecv' });

    peer.onicecandidate = (e) => onICECandidateEvent(e, remoteUserId);
    peer.ontrack = (ev) => onTrackEvent(ev, userId);
    peer.onnegotiationneeded = () => { return onNegotiation(remoteUserId) };

    this.peers[remoteUserId] = peer;
    return peer;
  }

  getPeer(remoteUserId) {
    return this.peers[remoteUserId];
  }

  removePeer(remoteUserId) {
    if (this.peers[remoteUserId]) {
      this.peers[remoteUserId].close();
      delete this.peers[remoteUserId];
    }
  }

  isAlreadyConnected(remoteUserId) {
    return !!this.peers[remoteUserId];
  }

  async getOffer(remoteUserId) {
    const peer = this.getPeer(remoteUserId);
    if (peer.signalingState !== "stable") return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }

  // async getAnswer(remoteUserId, offer) {
  //   const peer = this.getPeer(remoteUserId);
  
  //   // Skip if already connected or remote description is set
  //   if (peer.signalingState !== "stable" || peer.remoteDescription?.type === "offer") {
  //     console.warn(`[WARN] Skipped answering - state: ${peer.signalingState}`);
  //     return;
  //   }
  
  //   await peer.setRemoteDescription(new RTCSessionDescription(offer));
  //   const answer = await peer.createAnswer();
  //   await peer.setLocalDescription(answer);
  //   return answer;
  // }  

  async getAnswer(remoteUserId, offer) {
    const peer = this.getPeer(remoteUserId);
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setLocalDescription(remoteUserId, answer) {
    const peer = this.getPeer(remoteUserId);
    if (peer.signalingState === 'have-local-offer')
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    else
      console.warn(`[WARN] Skipped setting remote description. Current state: ${peer.signalingState}`);    
  }
}

export default new PeerService();