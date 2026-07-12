"use client";

import { useEffect, useState, memo, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, MapPin, ImagePlus, RotateCcw, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { generateReportSummaryAction } from "@/lib/actions";
import { addReport, addNotification } from "@/lib/data";
import { getCategory } from "@/lib/categories";
import { categories } from "@/lib/categories";
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
import imageCompression from 'browser-image-compression';
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
import { Checkbox } from "@/components/ui/checkbox";

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
        .refine(file => file.size <= 10 * 1024 * 1024, 'O tamanho da foto original não pode exceder 10MB.'),
});

export function ReportForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAwareChecked, setIsAwareChecked] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof ClientReportSchema> | null>(null);

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

  useEffect(() => {
    if (user?.uid) {
      setValue('userId', user.uid);
    }
  }, [user, setValue]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
  }, [setValue]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const options = {
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.5
        };
        
        const compressedFile = await imageCompression(file, options);
        
        const finalFile = new File([compressedFile], compressedFile.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
        });

        setValue('photo', finalFile, { shouldValidate: true });
        
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(finalFile);
      } catch (error) {
        console.error("Compression error:", error);
        toast({ variant: 'destructive', title: 'Erro na imagem', description: 'Não foi possível processar a foto. Tente novamente.' });
      } finally {
        setIsCompressing(false);
      }
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
  }, [reset, user?.uid, toast]);

  const onSubmit = (values: z.infer<typeof ClientReportSchema>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para enviar um relato.' });
        return;
    }

    if(values.latitude === 0 && values.longitude === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: "Por favor, selecione uma localização no mapa." });
      return;
    }

    setPendingValues(values);
    setIsConfirmDialogOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!user || !pendingValues) return;

    setIsConfirmDialogOpen(false);
    setIsRedirecting(true);

    try {
        let photoDataUri = photoPreview;
        if (!photoDataUri) {
          const reader = new FileReader();
          photoDataUri = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(pendingValues.photo);
          });
        }

        const categoryInfo = getCategory(pendingValues.category);
        const categoryLabel = categoryInfo?.label || pendingValues.category;
        const problemLabel = categoryInfo?.problems.find(p => p.value === pendingValues.problem)?.label || pendingValues.problem;
        const locationStr = pendingValues.reference ? `${pendingValues.address} (${pendingValues.reference})` : pendingValues.address;

        const aiResult = await generateReportSummaryAction({
          category: categoryLabel,
          problem: problemLabel,
          city: pendingValues.city,
          bairro: pendingValues.bairro,
          location: locationStr,
          description: pendingValues.description || "Nenhuma descrição fornecida.",
          photoUrl: photoDataUri as string,
        });

        const finalSummary = aiResult.success 
          ? aiResult.summary 
          : `${problemLabel} relatado em ${pendingValues.bairro}.`;

        const createdReport = await addReport({
          userId: user.uid,
          relatorEmail: user.email || "anonimo@inframais.com",
          category: pendingValues.category,
          problem: pendingValues.problem,
          city: pendingValues.city,
          bairro: pendingValues.bairro,
          location: locationStr,
          description: pendingValues.description || "",
          summary: finalSummary,
          photoUrl: photoDataUri as string,
          latitude: pendingValues.latitude,
          longitude: pendingValues.longitude,
        });

        await addNotification(
          user.uid,
          createdReport.id,
          'SENT',
          'Relato enviado com sucesso',
          'Seu relato foi enviado com sucesso e agora está em análise pela equipe do Infra Mais.'
        );

        toast({ title: "Sucesso!", description: "Relatório enviado com sucesso." });
        router.refresh();
        router.push('/minha-conta#meus-relatorios');
        
    } catch (error: any) {
        console.error("Submission failed:", error);
        toast({ variant: 'destructive', title: 'Erro', description: error.message || "Falha ao processar o envio. Verifique sua conexão e tente novamente." });
        setIsRedirecting(false);
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
    <Card className="w-full border-border shadow-2xl rounded-2xl overflow-hidden bg-card scroll-mt-32 max-w-[1750px] mx-auto">
      <CardHeader className="bg-muted/30 border-b border-border p-6 md:p-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-foreground text-center md:text-left">Relatar Problema</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-10">
                  <MapPin className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-bold text-foreground">Localização</Label>
              </div>
              <p className="text-xs text-muted-foreground italic mb-2">{deviceLabels.map}</p>
              <div className="rounded-2xl overflow-hidden border border-border h-[300px] md:h-[400px] relative z-0 bg-muted">
                  <LeafletMap interactive={true} onLocationSelect={handleMapClick} selectedLocation={locationObject} />
              </div>
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
                <div className="flex items-center gap-2 mb-2">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-bold text-foreground">Foto do Problema</Label>
                </div>
                <div className={cn(
                    "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all mx-auto w-full max-w-3xl",
                    photoPreview ? "bg-muted border-primary/50 shadow-inner" : "bg-muted/50 border-border hover:bg-muted hover:border-primary/30"
                )}>
                    {isCompressing ? (
                      <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-sm font-bold text-primary uppercase tracking-widest">Otimizando foto...</p>
                      </div>
                    ) : photoPreview ? (
                        <Image 
                            src={photoPreview} 
                            alt="Preview" 
                            fill 
                            className="object-cover" 
                            priority
                        />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm font-bold mt-2 text-muted-foreground">{deviceLabels.photo}</p>
                      </div>
                    )}
                    <input id="photo" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} aria-label="Upload de foto" disabled={isCompressing || isRedirecting} />
                </div>
                <FormMessage />
            </div>

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Descrição do Problema (Opcional)</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Descreva o que está acontecendo..." 
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
                  <Button variant="outline" type="button" className="h-12 rounded-xl font-bold w-full sm:w-auto text-muted-foreground hover:text-foreground" disabled={isRedirecting || isCompressing}>
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

              <Button type="submit" className="h-12 px-12 rounded-xl font-bold w-full sm:w-auto shadow-lg" disabled={form.formState.isSubmitting || isRedirecting || isCompressing}>
                {(form.formState.isSubmitting || isRedirecting) ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isCompressing ? "Aguarde..." : "Enviar Relatório"}
              </Button>
          </CardFooter>
        </form>
      </Form>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[400px] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="bg-primary px-6 py-4 text-white flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <AlertDialogHeader className="space-y-0 text-left">
              <AlertDialogTitle className="text-lg font-bold text-white leading-tight">Confirmar envio</AlertDialogTitle>
            </AlertDialogHeader>
          </div>
          
          <div className="p-6 space-y-5 bg-card">
            <div className="space-y-4">
              <p className="text-sm text-foreground leading-relaxed font-medium">
                Após a aprovação, o relato se tornará <strong>público</strong> e não poderá mais ser removido por você. 
                A exclusão só é permitida enquanto o status estiver <strong>Em Análise</strong>.
              </p>
            </div>

            <div 
              className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => setIsAwareChecked(!isAwareChecked)}
            >
              <Checkbox 
                id="aware-confirmation" 
                checked={isAwareChecked} 
                onCheckedChange={(val) => setIsAwareChecked(val as boolean)}
                className="mt-0.5 h-4 w-4 rounded-sm"
              />
              <Label 
                htmlFor="aware-confirmation" 
                className="text-xs font-bold leading-tight text-muted-foreground cursor-pointer select-none"
              >
                Estou ciente de que o relato poderá se tornar público após a aprovação da moderação.
              </Label>
            </div>

            <AlertDialogFooter className="flex flex-row items-center gap-2 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsConfirmDialogOpen(false)} 
                className="flex-1 h-10 rounded-xl font-bold text-muted-foreground text-xs"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleFinalSubmit} 
                disabled={!isAwareChecked}
                className="flex-[2] h-10 rounded-xl font-bold shadow-lg shadow-primary/20 text-xs"
              >
                Confirmar envio
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
