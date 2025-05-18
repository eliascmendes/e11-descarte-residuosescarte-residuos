# EcoVigia

EcoVigia é uma plataforma comunitária projetada para combater o descarte irregular de resíduos. Através dela, cidadãos podem denunciar locais de descarte inadequado em suas cidades, acompanhar o status dessas denúncias e colaborar ativamente para promover um ambiente urbano mais limpo e sustentável.

## Principais Funcionalidades

*   **Denúncias Georreferenciadas:** Reporte pontos de descarte irregular diretamente em um mapa interativo.
*   **Acompanhamento Comunitário:** Visualize denúncias de outros usuários e acompanhe o progresso da resolução.
*   **Upload de Evidências:** Anexe fotos às suas denúncias para fornecer mais detalhes.
*   **Priorização por Votos:** A comunidade pode votar nas denúncias mais críticas, ajudando a priorizar ações.
*   **Engajamento e Discussão:** Comente nas denúncias para discutir soluções e compartilhar informações.

## Tecnologias Utilizadas

*   **Backend:** Node.js, Express.js, PostgreSQL, JWT (autenticação), Multer (uploads), Swagger (documentação da API).
*   **Frontend:** HTML, CSS, JavaScript.
*   **Hospedagem:** Configurável para deploy na Render.

## Estrutura do Projeto

```
e11-descarte-residuos/
├── client/         # Frontend (HTML, CSS, JS)
├── server/         # Backend (Node.js/Express API)
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── db.js
│   └── index.js
├── .gitignore
├── LICENSE
├── package.json
├── README.md
└── render.yaml    
```

## Equipe de Desenvolvimento

*   **Elias** - Backend Developer ([GitHub](https://github.com/eliascmendhes))
*   **Hellem Mendonça** - Frontend Developer ([GitHub](https://github.com/hellemmendoncaa))
*   **Matheus Abreu** - Backend Developer ([GitHub](https://github.com/Matheus4breu))
*   **Railton Rosa** - Backend Developer ([GitHub](https://github.com/Railton-Carvalho))
*   **Raylan Bruno** - Frontend Developer ([GitHub](https://github.com/Raylan-BR))

## Licença

Distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.