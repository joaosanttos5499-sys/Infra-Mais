
"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Image from "next/image";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { submitReport, type FormState } from "@/lib/actions";
import { categories, getCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import { useUser } from "@/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ReportSchema } from "@/lib/schemas";

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
});

function SubmitButton() {
  const { formState: { isSubmitting } } = useFormContext();
  return (
    <Button type="submit" className="w-full bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500" disabled={isSubmitting} aria-disabled={isSubmitting}>
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enviar Relatório
    </Button>
  );
}

const ClientReportSchema = ReportSchema.extend({
    photo: z.instanceof(File, { message: 'A foto é obrigatória.'})
        .refine(file => file.size > 0, 'A foto é obrigatória.')
        .refine(file => file.size <= 4 * 1024 * 1024, 'O tamanho da foto não pode exceder 4MB.'),
});

export function ReportForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof ClientReportSchema>>({
    resolver: zodResolver(ClientReportSchema),
    defaultValues: {
      userId: user?.uid ?? '',
      category: '',
      problem: '',
      bairro: '',
      address: '',
      reference: '',
      description: '',
      latitude: 0,
      longitude: 0,
      photo: undefined,
    },
  });

  const { formState, setError, setValue, watch, control } = form;

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const selectedCategory = watch('category');
  const problems = getCategory(selectedCategory)?.problems || [];

  const handleAction = async (data: FormData): Promise<FormState> => {
    const result = await submitReport(undefined, data);
    if (result?.errors) {
      Object.keys(result.errors).forEach((key) => {
        const field = key as keyof FormState['errors'];
        const message = result.errors?.[field]?.join(', ');
        if(field === '_form') {
            toast({ variant: 'destructive', title: 'Erro ao enviar relatório', description: message });
        } else if (message) {
            setError(field, { type: 'manual', message });
        }
      });
    } else if (result?.success) {
      toast({ title: "Relatório enviado!", description: "Seu relatório foi enviado com sucesso."});
      router.push('/dashboard');
    }
    return result;
  };

  const onSubmit = async (values: z.infer<typeof ClientReportSchema>) => {
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      const formKey = key as keyof typeof values;
      const value = values[formKey];
      if (value !== undefined && value !== null) {
        formData.append(formKey, value as string | Blob);
      }
    });
    await handleAction(formData);
  };

  useEffect(() => {
    if (user) {
      setValue('userId', user.uid);
    }
  }, [user, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('photo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue('photo', undefined, { shouldValidate: true });
      setPhotoPreview(null);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
  };
  
  const resetForm = () => {
      form.reset();
      setPhotoPreview(null);
  }
  
  const selectedLocation = watch(['latitude', 'longitude']);
  const locationObject = selectedLocation[0] !== 0 && selectedLocation[1] !== 0 
    ? { lat: selectedLocation[0], lng: selectedLocation[1]} 
    : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl md:text-4xl mb-4">Preencha o Relatório</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para enviar um relatório para a cidade.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <input type="hidden" {...form.register('userId')} />
            <div className="space-y-2">
              <Label className="font-bold">Clique no mapa para marcar a localização do problema.</Label>
              <div className="rounded-lg overflow-hidden border relative z-0">
                  <LeafletMap 
                      interactive={true} 
                      onLocationSelect={handleMapClick}
                      selectedLocation={locationObject}
                  />
              </div>
            </div>
            <input type="hidden" {...form.register('latitude')} />
            <input type="hidden" {...form.register('longitude')} />
            
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger aria-label="Selecione a categoria">
                            <SelectValue placeholder="Selecione o tipo de problema" />
                        </SelectTrigger>
                        </FormControl>
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
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <FormField
              control={control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Problema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                        <FormControl>
                        <SelectTrigger aria-label="Selecione o problema específico">
                            <SelectValue placeholder={selectedCategory ? "Selecione o problema específico" : "Escolha uma categoria primeiro"} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Problemas Específicos</SelectLabel>
                                {problems.map((problem) => (
                                    <SelectItem key={problem.value} value={problem.value}>
                                    {problem.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
              control={control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Centro, Vila Madalena" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Rua Principal, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ponto de Referência (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Esquina com a Av. 2, perto do mercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <Input id="photo" type="file" accept="image/*" className="file:text-primary file:font-semibold" onChange={handlePhotoChange} />
                {formState.errors?.photo && (
                <p className="text-sm font-medium text-destructive">{formState.errors.photo.message}</p>
                )}
            </div>
            
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                        placeholder="Forneça uma descrição detalhada do problema."
                        rows={5}
                        {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" type="button" onClick={resetForm} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resetar
              </Button>
              <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
