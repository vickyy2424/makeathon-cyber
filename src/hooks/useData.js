import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/api';

export function useCountUp(end, duration = 1500) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    if (end === prevEnd.current) return;
    const startVal = prevEnd.current;
    prevEnd.current = end;
    const startTime = performance.now();
    const diff = end - startVal;
    function animate(t) {
      const p = Math.min((t - startTime) / duration, 1);
      setValue(Math.floor(startVal + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [end, duration]);
  return value;
}

/** Poll a REST endpoint at interval */
export function usePolling(fetcher, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const result = await fetcher();
        if (active) { setData(result); setError(null); }
      } catch (e) {
        if (active) setError(e);
      }
    };
    poll();
    const timer = setInterval(poll, interval);
    return () => { active = false; clearInterval(timer); };
  }, [interval]);
  return { data, error };
}

/** Subscribe to a Socket.IO event */
export function useSocketEvent(eventName, initialValue = null) {
  const [data, setData] = useState(initialValue);
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload) => setData(payload);
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
  }, [eventName]);
  return data;
}

/** Accumulate Socket.IO events into a list */
export function useSocketList(eventName, maxItems = 50) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload) => {
      setItems(prev => {
        const id = payload.id || Date.now() + Math.random();
        return [{ ...payload, id }, ...prev].slice(0, maxItems);
      });
    };
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
  }, [eventName, maxItems]);
  return items;
}

// Legacy compat
export function useStableData(init, mutator, interval) {
  return usePolling(() => Promise.resolve(mutator(init())), interval)?.data || init();
}
export function useLiveData(gen, interval) {
  const [d, setD] = useState(gen());
  useEffect(() => { const t = setInterval(() => setD(gen()), interval); return () => clearInterval(t); }, []);
  return d;
}
export function useStreamingList(gen, interval, max = 50) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(Array.from({ length: 5 }, () => gen()));
    const t = setInterval(() => setItems(p => [gen(), ...p].slice(0, max)), interval);
    return () => clearInterval(t);
  }, []);
  return items;
}
