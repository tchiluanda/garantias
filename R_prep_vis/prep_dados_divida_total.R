library(tidyverse)
library(janitor)
library(readxl)


exercicio_interesse_siconfi <- 2019
periodo_interesse_coafi <- "Dez/2019"

# pega os dados divida total (siconfi) ------------------------------------

caminho <- "./R_prep_vis/outros_dados/"

tabela_estados <- read.csv2(paste0(caminho, "finbraRGF_2019_estados.csv"), 
                            skip = 5) %>%
  mutate(Escopo    = "Estados",
         Exercicio = exercicio_interesse_siconfi)

tabela_mun1 <- read.csv2(paste0(caminho, "finbraRGF_2019_mun_quad.csv"), 
                         skip = 5)
tabela_mun2 <- read.csv2(paste0(caminho, "finbraRGF_2019_mun_sem.csv"), 
                         skip = 5)

tabela_mun <- rbind(tabela_mun1, tabela_mun2) %>%
  mutate(Escopo    = "Municípios",
         Exercicio = exercicio_interesse_siconfi)

tabela_completa <- rbind(tabela_estados, tabela_mun)

#unique(tabela_completa$Conta)
#paste0(unique(tabela_completa$Coluna), "###")

dc <- tabela_completa %>%
  filter(Conta == "DÍVIDA CONSOLIDADA - DC (I)") %>%
  #filter(Conta == "Reestruturação da Dívida de Estados e Municípios") %>%
  #filter(Coluna == "SALDO DO EXERCÍCIO ANTERIOR") %>%
  filter(Coluna %in% c("Até o 3º Quadrimestre", "Até o 2º Semestre")) %>%
  group_by(Escopo) %>%
  summarise(Divida_Total = sum(Valor)) %>%
  janitor::adorn_totals("row")


# pega os dados divida com Uniao (Coafi) ----------------------------------

div_uniao_bruto <- read_excel(paste0(caminho, "SALDOS_DEVEDORES_PROGRAMAS_FINANCIAMENTO_GOVERNO_FEDERAL_2020jan.xls"), skip = 5)

div_uniao <- div_uniao_bruto %>%
  select(ATIVO, periodo_interesse_coafi) %>%
  filter(ATIVO == "Total") %>%
  rename(Divida_Uniao = periodo_interesse_coafi, 
         Escopo = ATIVO)


# pega os dados divida garantida ------------------------------------------

load("total_garantias_classificador.RData")

div_garantida <- total_classificador %>%
  rename(Escopo = Classificador,
         Divida_Garantida = 2) %>%
  filter(Escopo %in% c("Estados", "Municipios")) %>%
  mutate(Escopo = if_else(Escopo == "Municipios", "Municípios", Escopo)) %>%
  janitor::adorn_totals("row")


# organiza os dados para a visualizacao -----------------------------------

dividas <- dc %>%
  left_join(div_uniao) %>%
  left_join(div_garantida) %>%
  # isso tudo agora enquanto não temos os valores da Dívida União
  # aberto por Estados / Municípios... por enquanto estou alocando 
  # proporcionalmente
  group_by() %>%
  mutate(temp_total_Div = sum(Divida_Total)/2,
         temp_percent_total = Divida_Total / temp_total_Div,
         temp_total_DivUniao = sum(Divida_Uniao, na.rm = TRUE),
         Divida_Uniao = if_else(is.na(Divida_Uniao), 
                               temp_total_DivUniao * temp_percent_total,
                               Divida_Uniao)) %>%
  ungroup() %>%
  mutate(Divida_demais = Divida_Total - Divida_Uniao - Divida_Garantida) %>%
  select(-starts_with("temp_")) %>%
  filter(Escopo != "Total") %>%
  gather(-Escopo, key = tipo_divida, value = valor) %>%
  filter(tipo_divida != "Divida_Total")


# prototipinho da visualizacao --------------------------------------------

ggplot(dividas, aes(x = 1, y = valor, fill = tipo_divida)) + geom_col()
ggplot(dividas, aes(x = Escopo, y = valor, fill = tipo_divida)) + geom_col()
ggplot(dividas, aes(x = tipo_divida, y = valor, fill = Escopo)) + geom_col()
ggplot(dividas, aes(x = tipo_divida, y = valor, fill = Escopo)) + geom_col(position = position_dodge())




