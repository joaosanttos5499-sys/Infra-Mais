
"use client";

import { useEffect, useState, memo, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, MapPin, ImagePlus } from "lucide-react";
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

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Carregando mapa...</div>
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
  const { user, isUserLoading } = useUser();
  const router = useRouter();
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

  const onSubmit = async (values: z.infer<typeof ClientReportSchema>) => {
    const formData = new FormData();
    formData.append('photo', values.photo);
    Object.keys(values).forEach(key => {
        if (key !== 'photo') formData.append(key, String((values as any)[key]));
    });

    const result = await submitReport(undefined, formData);
    if (result?.success) {
      setIsRedirecting(true);
      toast({ title: "Sucesso!", description: "Relatório enviado." });
      router.push('/minha-conta#meus-relatorios');
    } else {
      toast({ variant: 'destructive', title: 'Erro ao enviar', description: result?.errors?._form?.[0] });
    }
  };

  const scrollToElement = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  if (isEmailEmployee(user?.email)) {
    return (
        <Card className="w-full max-w-2xl border-primary/20 bg-primary/5 rounded-2xl p-10 text-center">
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Acesso Restrito</CardTitle>
            <p className="mt-4 text-muted-foreground">Funcionários não podem enviar relatos.</p>
            <Button asChild className="mt-6"><Link href="/funcionarios">Painel de Gestão</Link></Button>
        </Card>
    );
  }

  return (
    <Card className="w-full border-border shadow-2xl rounded-2xl overflow-hidden bg-card">
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
                    <FormItem className="scroll-mt-28" id="field-category">
                        <FormLabel>Categoria</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          onOpenChange={(open) => open && scrollToElement('field-category')}
                        >
                            <FormControl>
                                <SelectTrigger 
                                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5"
                                >
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" position="popper" className="z-[2100] bg-card border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                {categories.map((c) => (
                                    <SelectItem 
                                        key={c.value} 
                                        value={c.value} 
                                        className="py-3 px-4 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 focus:bg-primary/10"
                                    >
                                        <div className="flex items-center gap-2 font-medium">
                                            <c.icon className="h-4 w-4" style={{ color: c.color }} />
                                            {c.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <FormField control={control} name="problem" render={({ field }) => (
                    <FormItem className="scroll-mt-28" id="field-problem">
                        <FormLabel>Problema Específico</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          disabled={!selectedCategory}
                          onOpenChange={(open) => open && scrollToElement('field-problem')}
                        >
                            <FormControl>
                                <SelectTrigger 
                                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5"
                                >
                                    <SelectValue placeholder="O que houve?" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" position="popper" className="z-[2100] bg-card border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                {problems.map((p) => (
                                    <SelectItem 
                                        key={p.value} 
                                        value={p.value} 
                                        className="py-3 px-4 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 focus:bg-primary/10"
                                    >
                                        <span className="font-medium">{p.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="city" render={({ field }) => (
                    <FormItem className="scroll-mt-28" id="field-city">
                        <FormLabel>Cidade</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          onOpenChange={(open) => open && scrollToElement('field-city')}
                        >
                            <FormControl>
                                <SelectTrigger 
                                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5"
                                >
                                    <SelectValue placeholder="Selecione a cidade" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" position="popper" className="z-[2100] bg-card border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <SelectItem value="Picui" className="py-3 px-4 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 focus:bg-primary/10 font-medium">
                                    Picuí
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <FormField control={control} name="bairro" render={({ field }) => (
                    <FormItem className="scroll-mt-28" id="field-bairro">
                        <FormLabel>Bairro</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          disabled={!selectedCity}
                          onOpenChange={(open) => open && scrollToElement('field-bairro')}
                        >
                            <FormControl>
                                <SelectTrigger 
                                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-2 focus:ring-primary/20 transition-all hover:bg-primary/5"
                                >
                                    <SelectValue placeholder="Selecione o bairro" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent side="bottom" position="popper" className="z-[2100] bg-card border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                {PICUI_NEIGHBORHOODS.map((b) => (
                                    <SelectItem 
                                        key={b} 
                                        value={b} 
                                        className="py-3 px-4 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 focus:bg-primary/10 font-medium"
                                    >
                                        {b}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                    </FormItem>
                )} />
                <FormField control={control} name="reference" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ponto de Referência (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Próximo ao mercadinho" className="h-12 rounded-xl bg-muted/20 border-border" {...field} />
                        </FormControl>
                    </FormItem>
                )} />
            </div>

            <div className="space-y-4">
                <Label className="font-bold flex items-center gap-2 text-foreground"><ImagePlus className="h-5 w-5 text-primary" /> Foto do Problema</Label>
                <div className={cn("aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all", photoPreview ? "bg-muted border-primary/50" : "bg-muted/50 border-border hover:bg-muted hover:border-primary/30")}>
                    {photoPreview ? <Image src={photoPreview} alt="Preview" fill className="object-cover" /> : (
                      <div className="text-center p-4">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm font-bold mt-2 text-muted-foreground">{deviceLabels.photo}</p>
                      </div>
                    )}
                    <input id="photo" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                </div>
                <FormMessage />
            </div>

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea placeholder="Descreva o problema em mais detalhes se necessário..." className="min-h-[120px] rounded-2xl bg-muted/20 border-border" {...field} /></FormControl></FormItem>
            )} />
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-border p-6 md:p-8 flex flex-col sm:flex-row justify-between gap-4">
              <Button variant="outline" type="button" onClick={() => { reset(); setPhotoPreview(null); }} className="h-12 rounded-xl font-bold w-full sm:w-auto" disabled={isRedirecting}>Limpar Formulário</Button>
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
