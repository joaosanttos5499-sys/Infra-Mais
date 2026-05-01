
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
        "O Infra Mais é uma plataforma de zeladoria urbana que conecta os cidadãos de Picuí à prefeitura. Ela permite o registro geolocalizado de problemas de infraestrutura (como buracos, iluminação ou vazamentos), facilitando a comunicação e agilizando a resolução das demandas da comunidade.",
    },
    {
      question: "Preciso de uma conta para relatar um problema?",
      answer:
        "Sim. Para garantir a autenticidade dos relatos e permitir que você acompanhe suas solicitações, é necessário criar uma conta ou fazer login. Usuários anônimos podem visualizar o mapa e os relatos, mas não podem enviar novas demandas.",
    },
    {
      question: "Como eu relato um problema?",
      answer:
        'Após fazer login, clique em "Relatar um Problema". No formulário: \n1. Marque o local exato no mapa. \n2. Escolha a categoria e o problema específico. \n3. Selecione o bairro (em Picuí) e digite o endereço. \n4. Anexe obrigatoriamente uma foto do problema (até 5MB). \n5. Adicione uma descrição se desejar.',
    },
    {
      question: "Por que a foto é obrigatória?",
      answer:
        "A foto é essencial para que a equipe técnica da prefeitura avalie a gravidade e o tipo de equipamento necessário para o conserto antes mesmo de ir ao local. Isso economiza tempo e recursos públicos.",
    },
    {
      question: "O que acontece depois que eu envio um relatório?",
      answer:
        "Seu relatório é processado por uma Inteligência Artificial que gera um resumo conciso para os funcionários da cidade. O relato fica visível no mapa e no painel público. A equipe da prefeitura atualizará o status conforme o progresso: 'Pendente', 'Em Andamento' ou 'Resolvido'.",
    },
    {
      question: "Para que serve o botão 'Apoiar'?",
      answer:
        "Se você encontrar um problema já relatado que também te afeta, use o botão 'Apoiar'. Quanto mais apoios um relato recebe, maior é a visibilidade dele no painel, ajudando a prefeitura a identificar as demandas mais críticas para a comunidade.",
    },
    {
      question: "Posso excluir um relatório que eu enviei?",
      answer:
        "Sim. Se você enviou algo por engano ou o problema foi resolvido de outra forma, você pode excluir seu relato. Vá em 'Minha Conta' ou encontre seu card no painel de 'Relatos' e clique no ícone de lixeira. A exclusão removerá o problema do mapa e de todas as listagens do site.",
    },
    {
      question: "Como vejo se o problema foi realmente resolvido?",
      answer:
        "Quando um problema é marcado como 'Resolvido', os funcionários podem anexar uma foto do 'Depois'. Você pode ver essa foto clicando no card do problema no painel, permitindo uma prestação de contas transparente.",
    },
    {
      question: "Por que não consigo alterar meu nome no perfil novamente?",
      answer:
        "Para evitar abusos e manter a consistência dos dados, o Infra Mais permite a alteração do nome de exibição apenas uma vez a cada 7 dias. Se você alterou recentemente, precisará aguardar esse prazo para uma nova mudança.",
    },
    {
      question: "O Infra Mais atende outras cidades além de Picuí?",
      answer:
        "No momento, o sistema está configurado especificamente para a cidade de Picuí, incluindo a listagem oficial de seus bairros para garantir a precisão dos dados enviados à gestão municipal.",
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
            <p className="text-muted-foreground mt-2">
              Tudo o que você precisa saber para ajudar a melhorar nossa cidade.
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
              Se você encontrou algum problema técnico no site ou tem uma sugestão, entre em contato com a equipe de TI da prefeitura ou visite a sede administrativa.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
