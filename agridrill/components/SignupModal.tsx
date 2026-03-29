import React from "react";

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", color: "black", padding: 32, borderRadius: 8, minWidth: 320 }}>
        <h2>Signup Modal</h2>
        <p>This is a placeholder for the signup modal.</p>
        <button onClick={onClose}>Close</button>
        <button onClick={onSwitchToLogin} style={{ marginLeft: 8 }}>Switch to Login</button>
      </div>
    </div>
  );
}
