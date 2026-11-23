# Mundo das Descobertas — guia para escolas

Versão 38. Este guia é para quem instala e coordena o aplicativo na escola (secretaria, TI ou coordenação). O app funciona **sem servidor e sem conta**: os dados ficam no navegador de cada aparelho.

## 1. Como funciona (em uma frase)
O aplicativo é um site que se instala como app e funciona offline. Nada é enviado para a internet: nomes, progresso e relatórios ficam só no aparelho.

## 2. Publicar
1. Publique a **pasta inteira** (inclui `fonts/` e `images/`) em um serviço de hospedagem estática: Netlify, Cloudflare Pages ou GitHub Pages. Se faltar `app.js` ou `styles.css`, o app abre em branco.
2. Abra o endereço no aparelho. Para instalar: menu do navegador > "Instalar aplicativo" (Chrome/Edge) ou "Adicionar à tela de início" (Safari).
3. Na primeira abertura, um adulto lê e aceita o aviso de privacidade.
4. Depois da primeira visita o app funciona sem internet.

Para atualizar: publique a pasta de novo. Os aparelhos recebem a versão nova na próxima abertura e o Painel da escola mostra um aviso "Atualizar agora".

## 3. Rede da escola
Libere apenas o endereço onde o app foi publicado. O app não usa Google Fonts, analytics de terceiros nem outros domínios. (A contagem anônima de visitas, se ligada, é feita pela hospedagem, sem cookies.)

## 4. Primeira configuração (uma vez por turma)
1. Em **um** aparelho: abra a Área dos adultos (engrenagem) > **Painel da escola**.
2. **Cadastrar a turma de uma vez**: cole a lista (`nome; turma; ano; nascimento`, só o nome é obrigatório). Veja a prévia e confirme. Use primeiro nome ou apelido, se preferir.
3. **Salvar só esta turma**: gera um arquivo `.json`.
4. Nos outros aparelhos: Painel da escola > **Importar de um arquivo**. A prévia mostra novos e atualizados; nada é apagado.
5. Ative o **PIN dos adultos** (Área dos adultos) para a criança não abrir relatórios e avaliações.

## 5. Tablet ou computador compartilhado
Painel da escola > **Aparelho compartilhado: ligado**. O app deixa de continuar no aluno anterior: ao abrir, ao tocar no nome do aluno e depois de 3, 5 ou 10 minutos parado, volta para "Quem vai estudar?". Isso evita que uma criança veja a tela de outra.

## 6. Acompanhamento
- **Relatório da turma** (com PIN): uso e participação por aluno, rodadas por área e projetos concluídos. Pode imprimir ou baixar em CSV.
- **Relatório do aluno** e **avaliação guiada**: instrumentos de acompanhamento, **não são diagnóstico**. Resultados devem ser interpretados por profissional habilitado.
- Os dados de cada aparelho só aparecem naquele aparelho. Para reunir a turma, importe as cópias em um aparelho (item 7).

## 7. Cópias de segurança (importante)
Os dados ficam no navegador. Limpar dados de navegação, trocar de navegador ou usar janela anônima apaga o progresso daquele aparelho.
- Salve uma cópia pelo menos a cada 2 semanas. O Painel mostra a data da última.
- Para reunir alunos de vários aparelhos: salve a cópia em cada um e importe todas no aparelho do professor. Para quem existe nos dois, fica a versão com atividade mais recente.
- O arquivo tem dados pessoais de crianças: guarde em local protegido da escola e não compartilhe em grupos de mensagens.
- **Fim do ano**: Painel da escola > Relatório e fim de ano > salve a cópia da turma e remova a turma do aparelho.

## 8. LGPD — o que a escola precisa fazer
O app foi feito para coletar o mínimo (nome ou apelido; o resto é opcional) e guardar tudo no aparelho. Mesmo assim, para uso institucional:
- [ ] Revisar com advogado(a) ou com o encarregado de dados (DPO) o texto da tela "Privacidade e termos de uso". O texto é um modelo de apoio, **não substitui orientação jurídica**.
- [ ] Preencher o contato do responsável (`PRIV_CONTACT` em `src/02-estado.js`, depois `node build.js`).
- [ ] Informar as famílias sobre o uso e a finalidade (reforço e acompanhamento pedagógico).
- [ ] Definir quem guarda e por quanto tempo as cópias de segurança.
- [ ] Usar o PIN e, em aparelhos compartilhados, o modo compartilhado.

## 9. Limites conhecidos
- Não há login nem sincronização automática: a troca entre aparelhos é por arquivo.
- O PIN é uma barreira contra a criança, não uma proteção forte: quem sabe mexer nos dados do navegador consegue contornar.
- A voz usa o que o aparelho tem. Em Chromebooks e tablets, confira se há voz em português do Brasil (Área dos adultos > Conforto sensorial > Testar).
- O conteúdo e a avaliação ainda precisam de revisão pedagógica por professor(a) ou psicopedagogo(a).
- A acessibilidade passou por auditoria automática; falta teste com leitores de tela reais.

## 10. Para quem mantém o código
O código-fonte está em `src/` (24 arquivos em ordem numérica). O `app.js` é gerado: edite `src/` e rode `node build.js`. `node build.js --check` confere. `npm i` e `npm test` rodam os testes automáticos (Playwright). A cada mudança, suba a versão do cache em `sw.js`.
