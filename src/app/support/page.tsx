
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
        "O Infra Mais é uma plataforma que conecta os cidadãos à prefeitura, permitindo relatar problemas de infraestrutura na cidade de forma rápida e transparente. Nosso objetivo é facilitar a comunicação e agilizar a resolução das demandas da comunidade.",
    },
    {
      question: "Como eu relato um problema?",
      answer:
        'Para relatar um problema, clique no botão "Relatar um Problema" na página inicial ou no menu de navegação. Você será direcionado a um formulário onde poderá preencher a categoria do problema, a localização exata no mapa, uma descrição e, opcionalmente, enviar uma foto.',
    },
    {
      question: "O que acontece depois que eu envio um relatório?",
      answer:
        "Após o envio, seu relatório é analisado por nossa inteligência artificial para criar um resumo e fica visível no painel com o status 'Pendente'. A equipe da prefeitura então assume o caso, atualizando o status para 'Em Andamento' e, finalmente, 'Resolvido' quando o problema for solucionado.",
    },
    {
      question: "O que significam os status 'Pendente', 'Em Andamento' e 'Resolvido'?",
      answer:
        "• Pendente: O relatório foi recebido e está aguardando a análise da equipe responsável. \n• Em Andamento: A equipe já está trabalhando na solução do problema. \n• Resolvido: O problema foi solucionado pela prefeitura.",
    },
    {
      question: "Para que serve o botão 'Apoiar'?",
      answer:
        "O botão 'Apoiar' serve para que outros cidadãos demonstrem que também consideram aquele problema relevante. Um maior número de apoios pode ajudar a prefeitura a priorizar as demandas mais urgentes da comunidade.",
    },
    {
      question: "Posso editar um relatório depois de enviado?",
      answer:
        "Não, após o envio, o relatório não pode ser editado pelo usuário. Isso garante a integridade das informações para a equipe da prefeitura. Se você precisar adicionar informações, recomendamos criar um novo relatório fazendo referência ao anterior.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold font-headline">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-2">
              Tire suas dúvidas sobre o funcionamento da plataforma.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
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
