"use client";
import { useEffect, useRef } from "react";

export default function Modal({ onClose, children }) {
  const r = useRef(null);
  useEffect(() => { if (r.current && !r.current.open) r.current.showModal(); }, []);
  return <dialog ref={r} onClose={onClose}>{children}</dialog>;
}
