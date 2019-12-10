library(tidyverse)

load("R/Garantias.Rdata")


# Dados Bubble Chart ------------------------------------------------------

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


# Dados Quadro ------------------------------------------------------------

quadro <- list(
  
  agrupador_total %>%
    select(Inicio, Classificador, Periodo,
           total_total,
           interna_USD, 
           interna_total, 
           externa_total),
  
  agrupador_atm_completo %>%
    select(Inicio, Classificador, Periodo,
           ATM_Total),
  
  agrupador_custo_completo %>%
    select(Inicio, Classificador, Periodo,
           Custo_Total),
  
  agrupador_percentual_vincendo %>%
    select(Inicio, Classificador, Periodo,
           Ate_12_meses, Ate_12_meses_percentual, 
           De_1_2_anos, De_1_2_anos_percentual, 
           De_2_3_anos, De_2_3_anos_percentual, 
           De_3_4_anos, De_3_4_anos_percentual, 
           De_4_5_anos, De_4_5_anos_percentual, 
           Acima_5_anos, Acima_5_anos_percentual)) %>%
  
  reduce(full_join, by = c("Inicio", "Classificador", "Periodo")) %>%
  # juntamos todos, agora as limpezas
  filter(Periodo == max(Periodo),
         Inicio != Classificador) %>%
  mutate(Custo_Total = as.character(Custo_Total)) %>%
  mutate_at(.vars = vars(ends_with("_percentual")), .funs = ~as.character(.)) %>%
  mutate_if(is.factor, .funs = ~as.numeric(
    str_replace(
      str_replace_all(
        as.character(.), "\\.", ""), ",", "\\.")))

write.csv(quadro, file = "webpage/dados_quadro.csv", fileEncoding = "UTF-8")
