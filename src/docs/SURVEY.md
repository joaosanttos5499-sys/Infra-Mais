# Levantamento Técnico: Projeto Infra Mais

Este documento contém as informações técnicas levantadas para a elaboração do relatório técnico do projeto.

## 1. Visão Geral do Projeto
* **Objetivo principal:** Facilitar a comunicação entre cidadãos e gestão urbana para manutenção da infraestrutura.
* **Problema:** Morosidade e falta de transparência em reparos públicos.
* **Público-alvo:** Cidadãos e funcionários públicos.
* **Benefícios:** Gestão baseada em evidências geolocalizadas e transparência em tempo real.

## 2. Planejamento do Sistema
* **Arquitetura:** Next.js App Router (Híbrido SSR/CSR).
* **Fluxo:** Relato -> Sumarização AI -> Análise Humana -> Resolução.
* **Decisões:** Foco em "Path-based ownership" no Firestore para segurança nativa.

## 3. Tecnologias Utilizadas
* **Next.js 15:** Framework base.
* **Firebase (Auth/Firestore):** Backend as a Service.
* **Google Genkit:** Integração de IA Generativa.
* **Leaflet:** Mapas interativos.
* **Tailwind CSS & Shadcn UI:** Design e consistência visual.
* **Zod:** Validação de dados robusta.

## 4. Arquitetura do Projeto
* **Estrutura de Pastas:** Separação clara entre UI (components), Lógica (lib/data), Ações (lib/actions) e AI (src/ai).
* **Banco de Dados:** Hierarquia `/users/{uid}/reports` para isolamento de dados.

## 5. Funcionalidades Implementadas
* Gestão de Perfis com verificação.
* Relato geolocalizado com foto.
* Sumarização de problemas via Gemini.
* Dashboard administrativo e público.
* Sistema de notificações e denúncias.

## 6. Segurança
* Regras de segurança no Firestore bloqueiam acessos não autorizados.
* RBAC (Role-Based Access Control) diferenciando usuários de funcionários via e-mail.

## 7. Desafios e Soluções
* **Permissões em SSR:** Resolvido movendo leituras privadas para o Client Side.
* **Índices Firestore:** Resolvido com ordenação em memória para agilizar o desenvolvimento.
* **Serialização:** Tratamento de Timestamps para formatos compatíveis com JSON.

## 8. Melhorias Futuras
* App nativo ou PWA avançado.
* IA para detecção automática de gravidade em fotos.
* Integração direta com sistemas de ordem de serviço municipais.
