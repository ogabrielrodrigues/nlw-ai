import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/axios";
import { useEffect, useState } from "react";

interface Prompt {
  id: string;
  title: string;
  template: string;
}

interface Props {
  onPromptSelected: (template: string) => void;
}

export function PromptSelect({ onPromptSelected }: Props) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  useEffect(() => {
    api.get("/prompts").then((response) => setPrompts(response.data));
  }, []);

  function handlePromptSelected(id: string) {
    const findedPrompt = prompts?.find((prompt) => prompt.id === id);

    if (!findedPrompt) {
      return;
    }

    onPromptSelected(findedPrompt.template);
  }

  return (
    <Select onValueChange={(e) => handlePromptSelected(e)}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>
      <SelectContent>
        {prompts?.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
