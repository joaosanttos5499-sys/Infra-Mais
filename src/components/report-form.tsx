"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { submitReport } from "@/lib/actions";
import { categories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enviar Relatório
    </Button>
  );
}

export function ReportForm() {
  const [formState, formAction] = useActionState(submitReport, undefined);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (formState?.errors?._form) {
      toast({
        title: "Erro",
        description: formState.errors._form.join(", "),
        variant: "destructive",
      });
    }
  }, [formState, toast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const photoPlaceholder = PlaceHolderImages.find(p => p.id === 'report-photo-placeholder')?.imageUrl || "https://picsum.photos/seed/placeholder/400/300";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Relatar um Problema</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para enviar um relatório para a cidade.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" required>
              <SelectTrigger id="category" aria-label="Selecione a categoria">
                <SelectValue placeholder="Selecione o tipo de problema" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categorias de Problemas</SelectLabel>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {formState?.errors?.category && (
              <p className="text-sm font-medium text-destructive">{formState.errors.category}</p>
            )}
          </div>
           <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              name="bairro"
              placeholder="ex: Centro, Vila Madalena"
              required
            />
            {formState?.errors?.bairro && (
              <p className="text-sm font-medium text-destructive">{formState.errors.bairro}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Endereço</Label>
            <Input
              id="location"
              name="location"
              placeholder="ex: Esquina da Rua Principal com a Av. 2"
              required
            />
            {formState?.errors?.location && (
              <p className="text-sm font-medium text-destructive">{formState.errors.location}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Foto do Problema</Label>
            <div className="aspect-video rounded-md border border-dashed flex items-center justify-center relative overflow-hidden bg-muted/50">
                {photoPreview ? (
                    <Image src={photoPreview} alt="Pré-visualização da foto enviada" fill className="object-cover" />
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <Camera className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm">Carregar uma foto</p>
                    </div>
                )}
            </div>
            <Input id="photo" name="photo" type="file" accept="image/*" required className="file:text-primary file:font-semibold" onChange={handlePhotoChange} ref={photoInputRef} />
             {formState?.errors?.photo && (
              <p className="text-sm font-medium text-destructive">{formState.errors.photo}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Forneça uma descrição detalhada do problema."
              required
              rows={5}
            />
            {formState?.errors?.description && (
              <p className="text-sm font-medium text-destructive">{formState.errors.description}</p>
            )}
          </div>
           {formState?.errors?._form && (
            <Alert variant="destructive">
              <AlertTitle>Falha no Envio</AlertTitle>
              <AlertDescription>{formState.errors._form.join(', ')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => { formRef.current?.reset(); setPhotoPreview(null); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resetar
            </Button>
            <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
