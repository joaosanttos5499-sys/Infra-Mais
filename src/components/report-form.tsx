"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Image from "next/image";
import { Camera, Loader2, RefreshCw, ShieldAlert, MapPin, Info, ImagePlus, FileText } from "lucide-react";
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
import { isEmailEmployee } from "@/lib/config";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
});

function SubmitButton({ isRedirecting }: { isRedirecting: boolean }) {
  const { formState: { isSubmitting } } = useFormContext();
  const isLoading = isSubmitting || isRedirecting;

  return (
    <Button 
      type="submit" 
      className={cn(
        "w-full sm:w-auto px-8 transition-all duration-300 shadow-md",
        isLoading 
          ? "opacity-50 cursor-not-allowed" 
          : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02]"
      )} 
      disabled={isLoading} 
      aria-disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        "Enviar Relatório"
      )}
    </Button>
  );
}

const ClientReportSchema = ReportSchema.extend({
    photo: z.instanceof(File, { message: 'A foto é obrigatória.'})
        .refine(file => file.size > 0, 'A foto é obrigatória.')
        .refine(file => file.size <= 5 * 1024 * 1024, 'O tamanho da foto não pode exceder 5MB.'),
});

const PICUI_NEIGHBORHOODS = [
  "Cenecista",
  "Centro",
  "JK",
  "Limeira",
  "Monte Santo",
  "Pedro Salustino de Lima",
  "Pedro Tomáz Dantas",
  "São José",
  "Zona Rural"
].sort((a, b) => a.localeCompare(b));

export function ReportForm() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const form = useForm<z.infer<typeof ClientReportSchema>>({
    resolver: zodResolver(ClientReportSchema),
    defaultValues: {
      userId: user?.uid ?? '',
      category: '',
      problem: '',
      city: '',
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
  const selectedCity = watch('city');
  const problems = getCategory(selectedCategory)?.problems || [];

  const isEmployee = isEmailEmployee(user?.email);

  const onSubmit = async (values: z.infer<typeof ClientReportSchema>) => {
    if (isEmployee) {
      toast({ variant: 'destructive', title: 'Ação Bloqueada', description: 'Funcionários não podem enviar relatos.' });
      return;
    }

    const formData = new FormData();
    formData.append('photo', values.photo);
    Object.keys(values).forEach(key => {
      const formKey = key as keyof typeof values;
      if (formKey !== 'photo') {
        const value = values[formKey];
        if (value !== undefined && value !== null) {
          formData.append(formKey, String(value));
        }
      }
    });

    const result = await submitReport(undefined, formData);

    if (result?.errors) {
      Object.keys(result.errors).forEach((key) => {
        const field = key as keyof FormState['errors'];
        const message = result.errors?.[field]?.join(', ');
        if (field === '_form') {
          toast({ variant: 'destructive', title: 'Erro ao enviar relatório', description: message });
        } else if (field && message) {
          setError(field, { type: 'manual', message });
        }
      });
    } else if (result?.success) {
      setIsRedirecting(true);
      toast({ 
        title: "Relatório submetido com sucesso!", 
        description: "Sua solicitação foi registrada. Você pode acompanhá-la em sua conta."
      });
      router.push('/minha-conta#meus-relatorios');
    }
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

  if (!isUserLoading && isEmployee) {
    return (
        <Card className="w-full max-w-2xl border-primary/20 bg-primary/5 rounded-2xl">
            <CardHeader className="text-center pt-10">
                <ShieldAlert className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-3xl font-bold">Acesso Restrito</CardTitle>
                <CardDescription className="text-lg">
                    Funcionários do Infra Mais não podem enviar relatos para garantir a imparcialidade do sistema.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-10 pt-4">
                <Button asChild size="lg" className="rounded-xl font-bold">
                    <Link href="/funcionarios">Ir para Painel de Gestão</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full border-gray-200 shadow-xl rounded-2xl overflow-hidden bg-white transition-all">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
        <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Preencha o Relatório</CardTitle>
            <CardDescription className="text-gray-500 text-base">
              Forneça os detalhes do problema para que possamos encaminhar para a solução.
            </CardDescription>
        </div>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-8 space-y-10">
            <input type="hidden" {...form.register('userId')} />
            
            {/* Seção 1: Mapa */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <Label className="text-lg font-bold text-gray-900">Onde está o problema?</Label>
              </div>
              <p className="text-sm text-gray-500 mb-4">Clique no mapa para marcar o local exato do ocorrido.</p>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0 h-[350px] md:h-[400px] hover:shadow-md transition-shadow duration-300">
                  <LeafletMap 
                      interactive={true} 
                      onLocationSelect={handleMapClick}
                      selectedLocation={locationObject}
                  />
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Seção 2: Categoria e Problema */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Info className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sobre o Problema</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700">Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:ring-primary/20">
                                    <SelectValue placeholder="Tipo de problema" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                    <SelectGroup>
                                    <SelectLabel>Categorias</SelectLabel>
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
                            <FormLabel className="text-sm font-semibold text-gray-700">Problema Específico</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                                <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:ring-primary/20">
                                    <SelectValue placeholder={selectedCategory ? "O que houve?" : "Escolha a categoria primeiro"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                    <SelectGroup>
                                        <SelectLabel>Problemas</SelectLabel>
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
                </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Seção 3: Localização Detalhada */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Localização Detalhada</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Cidade</FormLabel>
                        <Select onValueChange={(val) => {
                            field.onChange(val);
                            if (val === 'Picui') {
                            setValue('bairro', '');
                            }
                        }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:ring-primary/20">
                                <SelectValue placeholder="Selecione a cidade" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                            <SelectItem value="Picui">Picuí</SelectItem>
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
                        <FormLabel className="text-sm font-semibold text-gray-700">Bairro</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCity}>
                            <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-gray-300 focus:ring-primary/20">
                                <SelectValue placeholder={selectedCity ? "Escolha o bairro" : "Aguardando cidade..."} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                                {PICUI_NEIGHBORHOODS.map((bairro) => (
                                <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Rua e Número</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Rua Principal, 123" className="h-11 rounded-xl border-gray-300 focus:ring-primary/20" {...field} />
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
                        <FormLabel className="text-sm font-semibold text-gray-700">Ponto de Referência</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Próximo ao mercado" className="h-11 rounded-xl border-gray-300 focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Seção 4: Evidência Visual */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <ImagePlus className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Evidência Visual</h3>
                </div>

                <div className="space-y-4">
                    <div className={cn(
                        "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300",
                        photoPreview ? "border-primary/50 bg-gray-50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 hover:border-gray-300"
                    )}>
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="text-center p-8">
                                <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3 border border-gray-100">
                                    <Camera className="h-10 w-10 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">Clique abaixo para carregar a foto</p>
                                <p className="text-xs text-gray-400 mt-1">Obrigatório para comprovar o problema.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center">
                        <Input 
                            id="photo" 
                            type="file" 
                            accept="image/*" 
                            className="max-w-xs cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all" 
                            onChange={handlePhotoChange} 
                        />
                    </div>
                    {formState.errors?.photo && (
                        <p className="text-sm font-medium text-destructive text-center">{formState.errors.photo.message}</p>
                    )}
                </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Seção 5: Descrição */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Descrição Adicional</h3>
                </div>

                <FormField
                control={control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Textarea
                            placeholder="Descreva detalhes que podem ajudar na resolução (opcional)..."
                            className="min-h-[120px] rounded-2xl border-gray-300 focus:ring-primary/20 resize-none p-4 text-base"
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-8 flex flex-col sm:flex-row justify-between gap-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={resetForm} 
                className="w-full sm:w-auto h-11 px-6 rounded-xl border-gray-300 text-gray-600 font-bold hover:bg-white" 
                disabled={formState.isSubmitting || isRedirecting}
              >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar Formulário
              </Button>
              <SubmitButton isRedirecting={isRedirecting} />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
