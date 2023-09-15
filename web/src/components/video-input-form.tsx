import {
  BrainCircuit,
  CheckCircle2,
  Cog,
  FileVideo,
  Upload,
} from "lucide-react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = "waiting" | "converting" | "uploading" | "generating" | "success";

const statusMessages = {
  converting: "Convertendo...",
  generating: "Transcrevendo...",
  uploading: "Carregando...",
  success: "Sucesso!",
};

interface Props {
  onVideoUpload: (id: string) => void;
}

export function VideoInputForm({ onVideoUpload }: Props) {
  const [video, setVideo] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("waiting");
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  async function convertVideoToAudio(video: File) {
    const ffmpeg = await loadFFmpeg();

    await ffmpeg.writeFile("input.mp4", await fetchFile(video));

    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20k",
      "-acodec",
      "libmp3lame",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");

    const audioFileBlob = new Blob([data], { type: "audio/mpeg" });
    const audioFile = new File([audioFileBlob], "audio.mp3", {
      type: "audio/mpeg",
    });

    return audioFile;
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const { files } = e.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files.item(0);

    setVideo(selectedFile);
  }

  const previewURL = useMemo(() => {
    if (!video) return null;

    return URL.createObjectURL(video);
  }, [video]);

  async function handleUploadVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!video) {
      return;
    }

    setStatus("converting");

    const audioFile = await convertVideoToAudio(video);

    const data = new FormData();

    data.append("file", audioFile);

    setStatus("uploading");

    const response = await api.post("/videos", data);

    const id = response.data.id;

    setStatus("generating");

    const { data: transcription } = await api.post(
      `/videos/${id}/transcription`,
      {
        prompt,
      }
    );

    setStatus("success");
    onVideoUpload(id);
  }

  return (
    <form className="space-y-4" onSubmit={handleUploadVideo}>
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5 transition-colors"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          id="transcription_prompt"
          disabled={status != "waiting"}
          ref={promptInputRef}
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
        />
      </div>
      <Button
        disabled={status != "waiting"}
        type="submit"
        data-success={status === "success"}
        className="w-full data-[success=true]:bg-emerald-400 data-[success=true]:text-muted"
      >
        {status == "waiting" ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            {status !== "success" ? (
              <BrainCircuit className="w-4 h-4 mr-2 animate-scale repeat-infinite" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {statusMessages[status]}
          </>
        )}
      </Button>
    </form>
  );
}
