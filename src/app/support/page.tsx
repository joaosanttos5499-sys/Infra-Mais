
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-3">
              Tudo o que você precisa saber sobre como utilizar o Infra Mais.
            </p>
          </div>

          <Card className="shadow-md border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border-b last:border-0">
                    <AccordionTrigger className="text-left font-semibold text-base md:text-lg hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          
          <div className="mt-12 p-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <h3 className="text-lg font-bold text-amber-800 mb-2">Ainda tem dúvidas?</h3>
            <p className="text-amber-700 text-sm">
              Se você encontrou algum problema técnico no site ou deseja propor uma parceria em sua cidade, entre em contato conosco através de nossas redes sociais ou via e-mail de suporte da plataforma.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
