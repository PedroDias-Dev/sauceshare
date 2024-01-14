import File from "@/components/file";
import Image from "next/image";

export default function Home() {
  const files = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `File ${i}`,
    size: Math.random() * 1000,
    type: "image/png",
  }));

  return (
    <main className="flex min-h-screen flex-col gap-10 p-8">
      <h1 className="text-3xl font-bold">Your Files</h1>

      <hr className="border-neutral-500" />

      <div className="flex flex-col gap-4 w-full">
        {files.map((file) => (
          <File key={file.id} file={file} />
        ))}
      </div>
    </main>
  );
}
