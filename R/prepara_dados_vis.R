library(tidyverse)

load("R/Garantias.Rdata")

dados_vis_pre <- agrupador_total %>%
  filter(Periodo == max(Periodo),
         Inicio != Classificador) %>%
  select(Inicio, Classificador, valor = total_total) %>%
  mutate(valor = as.numeric(
    str_replace(str_replace_all(as.character(valor), "\\.", ""), ",", "\\.")),
    rank_geral = rank(-valor))

dados_vis <- dados_vis_pre %>%
  group_by(Classificador) %>%
  summarise(total_classificador = sum(valor)) %>%
  ungroup() %>%
  mutate(rank_classificadores = rank(-total_classificador)) %>%
  right_join(dados_vis_pre)

write.csv(dados_vis, file = "webpage/dados_vis.csv", fileEncoding = "UTF-8")

dados_vis %>% group_by(Classificador) %>% summarize(first(total_classificador))

dados_vis %>% filter(rank_geral>=16) %>% group_by() %>% summarise(sum(valor))
