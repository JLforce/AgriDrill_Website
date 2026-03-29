import React from "react";

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", color: "black", padding: 32, borderRadius: 8, minWidth: 320 }}>
        <h2>Login Modal</h2>
        <p>This is a placeholder for the login modal.</p>
        <button onClick={onClose}>Close</button>
        <button onClick={onSwitchToSignup} style={{ marginLeft: 8 }}>Switch to Signup</button>
      </div>
    </div>
  );
}
