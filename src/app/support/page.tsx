import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from "lucide-react";

export default function SupportPage() {
  const faqs = [
    {
      question: "O que é o Infra Mais?",
      answer:
        "O Infra Mais é uma plataforma independente de zeladoria urbana que visa facilitar a comunicação entre os cidadãos e os órgãos responsáveis pela manutenção das cidades. Ela permite o registro geolocalizado de problemas de infraestrutura, servindo como uma ferramenta de cidadania para cobrar e acompanhar melhorias no espaço público.",
    },
    {
      question: "O site é oficial de alguma prefeitura?",
      answer:
        "Não. O Infra Mais é uma plataforma privada e independente. Atuamos como um canal facilitador para que as demandas cheguem de forma organizada às gestões municipais, mas não somos um órgão governamental e não possuímos vínculo oficial com nenhuma prefeitura.",
    },
    {
      question: "Preciso de uma conta para relatar um problema?",
      answer:
        "Sim. Para garantir a seriedade dos relatos e permitir que você acompanhe o progresso das suas solicitações, é necessário criar uma conta. Isso ajuda a evitar dados falsos e mantém a integridade da plataforma.",
    },
    {
      question: "Como eu relato um problema?",
      answer:
        'Após fazer login, clique em "Relatar um Problema". No formulário: \n1. Marque o local exato no mapa. \n2. Escolha a categoria e o problema específico. \n3. Selecione a cidade e o bairro correspondente. \n4. Anexe obrigatoriamente uma foto do problema (até 5MB). \n5. Adicione uma descrição detalhada se desejar.',
    },
    {
      question: "Por que a foto é obrigatória?",
      answer:
        "A foto é a principal evidência da demanda. Ela permite que os gestores e a comunidade avaliem visualmente a gravidade e o tipo de reparo necessário, garantindo que o relato seja fundamentado em fatos reais.",
    },
    {
      question: "O que acontece depois que eu envio um relatório?",
      answer:
        "Seu relatório é processado por uma Inteligência Artificial que gera um resumo conciso para otimizar a leitura dos gestores. O relato fica visível publicamente para que outros cidadãos possam apoiar. Embora o site seja independente, as informações são estruturadas para que possam ser facilmente utilizadas pelas equipes de manutenção das cidades parceiras ou notificadas via canais públicos.",
    },
    {
      question: "Para que serve o botão 'Apoiar'?",
      answer:
        "O botão 'Apoiar' serve para dar relevância a um problema que afeta mais pessoas. Quanto mais apoios um relato recebe, maior é o destaque dele no painel, sinalizando para as autoridades que aquela é uma demanda prioritária da comunidade.",
    },
    {
      question: "Posso excluir um relatório que eu enviei?",
      answer:
        "Sim. Você tem total controle sobre seus relatos. Se enviou algo por engano ou o problema foi resolvido, basta ir em 'Minha Conta' e clicar no ícone de lixeira no card do relatório correspondente.",
    },
    {
      question: "Quais cidades o Infra Mais atende?",
      answer:
        "Atualmente, a plataforma está focada na cidade de Picuí-PB como projeto piloto. Nossa meta é expandir para o máximo de cidades possível, permitindo que cada vez mais cidadãos tenham uma ferramenta eficiente para colaborar com a melhoria de seus bairros.",
    },
    {
      question: "Por que não consigo alterar meu nome no perfil novamente?",
      answer:
        "Para manter a consistência e a responsabilidade dos dados, a alteração do nome de exibição é permitida apenas uma vez a cada 7 dias.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-12">
        <div className="max-w-[1750px] mx-auto">
          <div className="mb-10 text-center md:text-left space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Central de Suporte
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Tudo o que você precisa saber sobre como utilizar o Infra Mais.
            </p>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar dúvida..." 
              className="w-full pl-12 pr-4 py-6 rounded-xl border-border shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base bg-card text-foreground"
            />
          </div>

          <Card className="rounded-2xl border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border p-6">
              <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
                <HelpCircle className="h-6 w-6 text-primary" />
                Perguntas Frequentes (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    value={`item-${index}`} 
                    key={index} 
                    className="border-b-0 px-2 rounded-xl transition-all hover:bg-muted/50 data-[state=open]:bg-primary/5 data-[state=open]:border data-[state=open]:border-primary/10 mb-1"
                  >
                    <AccordionTrigger className="text-left font-bold text-base md:text-lg py-5 px-4 hover:no-underline hover:text-primary transition-colors text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap text-sm md:text-base leading-relaxed px-4 pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
