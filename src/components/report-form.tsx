
"use client";

import { useEffect, useState, memo, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, MapPin, ImagePlus, RotateCcw } from "lucide-react";
import { submitReport } from "@/lib/actions";
import { categories, getCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-muted animate-pulse flex items-center justify-center text-muted-foreground rounded-2xl">Carregando mapa...</div>
});

const PICUI_NEIGHBORHOODS = [
  "Cenecista", "Centro", "JK", "Limeira", "Monte Santo", 
  "Pedro Salustino de Lima", "Pedro Tomáz Dantas", "São José", "Zona Rural"
].sort((a, b) => a.localeCompare(b));

const ClientReportSchema = ReportSchema.extend({
    photo: z.instanceof(File, { message: 'A foto é obrigatória.'})
        .refine(file => file.size > 0, 'A foto é obrigatória.')
        .refine(file => file.size <= 5 * 1024 * 1024, 'O tamanho da foto não pode exceder 5MB.'),
});

export function ReportForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const formCardRef = useRef<HTMLDivElement>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [deviceLabels, setDeviceLabels] = useState({
    photo: "Clique para anexar uma foto",
    map: "Clique no mapa para marcar o local exato do problema."
  });
  
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

  const { setValue, watch, control, handleSubmit, reset } = form;
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const selectedCategory = watch('category');
  const selectedCity = watch('city');
  const selectedLat = watch('latitude');
  const selectedLng = watch('longitude');

  const problems = useMemo(() => getCategory(selectedCategory)?.problems || [], [selectedCategory]);
  const locationObject = useMemo(() => (selectedLat !== 0 && selectedLng !== 0 ? { lat: selectedLat, lng: selectedLng } : null), [selectedLat, selectedLng]);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setDeviceLabels({
      photo: isTouch ? "Toque para anexar uma foto" : "Clique para anexar uma foto",
      map: isTouch ? "Toque no mapa para marcar o local exato do problema." : "Clique no mapa para marcar o local exato do problema."
    });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
  }, [setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('photo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClearForm = useCallback(() => {
    reset({
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
    });
    setPhotoPreview(null);
    toast({ title: "Formulário limpo", description: "Todas as informações foram apagadas." });
    
    if (formCardRef.current) {
        const yOffset = -100;
        const y = formCardRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [reset, user?.uid, toast]);

  const onSubmit = async (values: z.infer<typeof ClientReportSchema>) => {
    const formData = new FormData();
    formData.append('photo', values.photo);
    Object.keys(values).forEach(key => {
        if (key !== 'photo') formData.append(key, String((values as any)[key]));
    });

    try {
        const result = await submitReport(undefined, formData);
        if (result?.success) {
          setIsRedirecting(true);
          toast({ title: "Sucesso!", description: "Relatório enviado." });
          router.push('/minha-conta#meus-relatorios');
        } else {
          toast({ variant: 'destructive', title: 'Erro ao enviar', description: result?.errors?._form?.[0] || "Verifique os campos." });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: "Ocorreu um erro ao processar sua solicitação." });
    }
  };

  if (isEmailEmployee(user?.email)) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-border shadow-xl">
            <Loader2 className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold">Acesso Restrito</h2>
            <p className="mt-4 text-muted-foreground">Funcionários não podem enviar relatos.</p>
            <Button asChild className="mt-6"><Link href="/funcionarios">Painel de Gestão</Link></Button>
        </div>
    );
  }

  return (
    <Card className="w-full border-border shadow-2xl rounded-2xl overflow-hidden bg-card scroll-mt-32" ref={formCardRef}>
      <CardHeader className="bg-muted/30 border-b border-border p-6 md:p-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-foreground text-center md:text-left">Relatar Problema</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-bold text-foreground">Localização</Label>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border h-[300px] md:h-[400px] relative z-0 bg-muted">
                  <LeafletMap interactive={true} onLocationSelect={handleMapClick} selectedLocation={locationObject} />
              </div>
              <p className="text-xs text-muted-foreground italic">{deviceLabels.map}</p>
            </div>

            <Separator className="bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="category" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} modal={false}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" avoidCollisions={true} className="z-[2200]">
                                {categories.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        <div className="flex items-center gap-2">
                                            <c.icon className="h-4 w-4" style={{ color: c.color }} />
                                            {c.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="problem" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Problema Específico</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory} modal={false}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5">
                                    <SelectValue placeholder="O que houve?" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" avoidCollisions={true} className="z-[2200]">
                                {problems.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} modal={false}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5">
                                    <SelectValue placeholder="Selecione a cidade" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" avoidCollisions={true} className="z-[2200]">
                                <SelectItem value="Picui">Picuí</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="bairro" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCity} modal={false}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5">
                                    <SelectValue placeholder="Selecione o bairro" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" avoidCollisions={true} className="z-[2200]">
                                {PICUI_NEIGHBORHOODS.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Rua Principal, 123" className="h-12 rounded-xl bg-muted/20 border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={control} name="reference" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ponto de Referência (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Próximo ao mercadinho" className="h-12 rounded-xl bg-muted/20 border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Label className="font-bold flex items-center gap-2 text-foreground">
                    <ImagePlus className="h-5 w-5 text-primary" /> Foto do Problema
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">(Até 5 Mb)</p>
                </div>
                <div className={cn("aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all", photoPreview ? "bg-muted border-primary/50" : "bg-muted/50 border-border hover:bg-muted hover:border-primary/30")}>
                    {photoPreview ? <Image src={photoPreview} alt="Preview" fill className="object-cover" /> : (
                      <div className="text-center p-4">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm font-bold mt-2 text-muted-foreground">{deviceLabels.photo}</p>
                      </div>
                    )}
                    <input id="photo" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} aria-label="Upload de foto" />
                </div>
                <FormMessage />
            </div>

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Descrição do Problema (Opcional)</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Descrição Detalhada" 
                            className="min-h-[120px] rounded-2xl bg-muted/20 border-border placeholder:text-muted-foreground" 
                            {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-border p-6 md:p-8 flex flex-col sm:flex-row justify-between gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button" className="h-12 rounded-xl font-bold w-full sm:w-auto text-muted-foreground hover:text-foreground" disabled={isRedirecting}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Limpar Formulário
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar informações?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover todos os dados preenchidos e o marcador no mapa. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearForm} className="bg-primary text-white rounded-xl font-bold">Sim, apagar tudo</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit" className="h-12 px-12 rounded-xl font-bold w-full sm:w-auto shadow-lg" disabled={form.formState.isSubmitting || isRedirecting}>
                {(form.formState.isSubmitting || isRedirecting) ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Enviar Relatório
              </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
