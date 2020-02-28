library(tidyverse)
library(janitor)


# Pega os dados -----------------------------------------------------------

caminho <- "./R_prep_vis/outros_dados/"

tabela_estados <- read.csv2(paste0(caminho, "finbraRGF_2019_estados.csv"), 
                            skip = 5) %>%
  mutate(Escopo    = "Estados",
         Exercicio = 2019)

tabela_mun1 <- read.csv2(paste0(caminho, "finbraRGF_2019_mun_quad.csv"), 
                         skip = 5)
tabela_mun2 <- read.csv2(paste0(caminho, "finbraRGF_2019_mun_sem.csv"), 
                         skip = 5)

tabela_mun <- rbind(tabela_mun1, tabela_mun2) %>%
  mutate(Escopo    = "Municípios",
         Exercicio = 2019)

tabela_completa <- rbind(tabela_estados, tabela_mun)

#unique(tabela_completa$Conta)
#paste0(unique(tabela_completa$Coluna), "###")

dc <- tabela_completa %>%
  filter(Conta == "DÍVIDA CONSOLIDADA - DC (I)") %>%
  filter(Coluna == "SALDO DO EXERCÍCIO ANTERIOR") %>%
  #filter(Coluna %in% c("Até o 3º Quadrimestre", "Até o 2º Semestre")) %>%
  group_by(Escopo) %>%
  summarise(Divida_Total = sum(Valor))
