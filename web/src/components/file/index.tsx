"use client";

import { Pause, PlayIcon } from "lucide-react";
import { useState } from "react";

const File = ({ file }: any) => {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      key={file.id}
      className={`flex items-center  gap-4 w-full border rounded-lg p-4 transition-all ${playing ? "bg-neutral-900" : ""}`}
    >
      {playing ? (
        <Pause
          className="cursor-pointer"
          onClick={() => setPlaying(false)}
          size={32}
        />
      ) : (
        <PlayIcon
          className="cursor-pointer"
          onClick={() => setPlaying(true)}
          size={32}
        />
      )}

      <div className="flex items-center gap-4 w-full">
        <div className="flex flex-col">
          <span className="font-bold">{file.name}</span>
          <span className="text-sm text-gray-500">{file.size}</span>
        </div>
      </div>
    </div>
  );
};

export default File;
