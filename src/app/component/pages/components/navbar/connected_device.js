"use client";
import { useEffect, useState, useRef } from "react";

export default function SpotifyDeviceStatus({ accessToken, onDeviceConnect, "data-tour": dataTour }) {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const checkDeviceStatus = async () => {
    try {
      const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      const devices = data.devices || [];

      const active = devices.find((d) => d.is_active);
      const inactiveDevices = devices.filter((d) => !d.is_active);
      
      if (active) {
        setConnectedDevice(active.name);
        setAvailableDevices(inactiveDevices);
      } else {
        setConnectedDevice(null);
        setAvailableDevices(devices);
      }
    } catch (error) {
      console.error("Error checking Spotify devices:", error);
      setConnectedDevice(null);
      setAvailableDevices([]);
    }
  };

  const handleConnect = async (deviceId) => {
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
      await checkDeviceStatus();
      onDeviceConnect();
      setOpen(false);
    } catch (error) {
      console.error("Failed to connect to device:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (accessToken) checkDeviceStatus();
  }, [accessToken]);

  return (
    <div className="relative p-4 text-sm text-white mt-8" ref={dropdownRef}>
      <button
        onClick={async () => {
          await checkDeviceStatus();
          setOpen((prev) => !prev);
        }}
        data-tour={dataTour}
        className="flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-full text-[#1DB954] border-2 border-green-500 hover:text-white bg-black/40 hover:bg-black/50 transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] shadow-inner shadow-white/5 hover:shadow-inner hover:shadow-green-300/10"
      >
        {connectedDevice ? `Connected to ${connectedDevice}` : "Connect Device"}
      </button>

      {open && (
        <div className="absolute mt-3 z-10 min-w-64 bg-white shadow-md rounded-lg dark:bg-neutral-800 dark:border dark:border-neutral-700 p-2 space-y-2">
          <p className="text-center text-red-500">
            If device not listed, open Spotify on the device
          </p>
          {availableDevices.length > 0 ? (
            availableDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => handleConnect(device.id)}
                className="w-full text-left px-4 py-2 hover:text-green-600 text-white rounded transition"
              >
                {device.name} ({device.type})
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-center text-sm text-neutral-300">
              No devices available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}