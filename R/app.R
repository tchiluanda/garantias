library(shiny)
library(readxl)
library(tidyr)
library(lubridate)
library(ggplot2)
library(plotly)
library(stringr)
library(dplyr)
library(shinydashboard)
library(flexdashboard)
library(bizdays)
library(matrixStats)
library(rlang)


#Definição Pasta de Processamento dos Arquivos

setwd("C:/Users/lucas.leite/Desktop/Lucas/RStudio/16. Painel Garantias - CODIV - SUDIP/R")

#___________________________________________________________________________________________

#Novo período (Data) - Último Quadrimestre

Novo_Periodo <- as.character("30abr2019") #alterar essa data para atualizar processamento dos dados

#Radical Dados Garantias Totais 

total <- as.character("Comp Indx ")

atm_total   <- as.character("ATM IntExt ")

atm_interno   <- as.character("ATM Int ")

atm_externo   <- as.character("ATM Ext ")

custo_total <- as.character("CustoMed IntExt ")

custo_interno <- as.character("CustoMed Int ")

custo_externo <- as.character("CustoMed Ext ")

percentual_vincendo <- as.character("PercVinc ")


#_________________________________________________________________________________

# Processamento - Garantias Totais, Interna e Externa; Data de REferência

#CSV - Total de Garantias

agrupador_total_bruto <- read.csv2(paste0(total,Novo_Periodo,".csv")) %>%
        rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)
        
linha_agrupador_total <- which(agrupador_total_bruto$Inicio=="Agrupador")

#Obtenção da Data de Referência da Base de Dados

data_referencia_total <- agrupador_total_bruto$Inicio[which(str_detect(agrupador_total_bruto$Inicio, "Data de Referência:"))]

data_referencia <- as.Date(str_sub(data_referencia_total,21,str_length(data_referencia_total)),"%d/%m/%Y" )

#Processamento da Base com total de Garantias - Formatada

lista_agrupador <- c("Garantia Total","Todas","Estados", "Bancos Federais", "Municípios","Estatais Federais","Entidades Estaduais Controladas","Empresas Privatizadas")


agrupador_total <- agrupador_total_bruto %>% 
    filter(row_number() > linha_agrupador_total) %>%
    rename(total_total=2,
                         total_IPCA=4, 
                         total_selic=6, 
                         total_TJLP = 8, 
                         total_TR=10,
                         total_cambial=12,
                         total_nao_indexado=14,
                         interna_total=16,
                         interna_USD=18,
                         interna_IPCA=20,
                         interna_selic=22,
                         interna_TJLP=24,
                         interna_TR=26,
                         interna_nao_indexado=28,
                         externa_total=30,
                         externa_USD=32,
                         externa_EUR=34,
                         externa_JPY=36,
                         externa_demais=38) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Total")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)
                    
#___________________________________________________________________________________________________________    
    
# Processamento - ATM (Avarage Time to Maturity) - TOTAl

#CSV - ATM Total

agrupador_atm_bruto <- read.csv2(paste0(atm_total,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm <- which(agrupador_atm_bruto$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm <- agrupador_atm_bruto %>% 
    filter(row_number() > linha_agrupador_atm) %>%
    rename(ATM_Total = 2,
           Financeiro_atm_total = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("ATM")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)
    
# Processamento - ATM (Avarage Time to Maturity) - INTERNO

#CSV - ATM Garantias

agrupador_atm_bruto_interno <- read.csv2(paste0(atm_interno,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm_interno <- which(agrupador_atm_bruto_interno$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm_interno <- agrupador_atm_bruto_interno %>% 
    filter(row_number() > linha_agrupador_atm_interno) %>%
    rename(ATM_interno = 2,
           Financeiro_atm_interno = 3) %>%
    mutate(Inicio = as.character(Inicio), 
       Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
       Periodo = data_referencia,
       Grupo = as.character("ATM")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)

# Processamento - ATM (Avarage Time to Maturity) - Externo

#CSV - ATM Garantias

agrupador_atm_bruto_externo <- read.csv2(paste0(atm_externo,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm_externo <- which(agrupador_atm_bruto_externo$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm_externo <- agrupador_atm_bruto_externo %>% 
    filter(row_number() > linha_agrupador_atm_externo) %>%
    rename(ATM_externo = 2,
           Financeiro_atm_externo = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("ATM")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)

# ATM Base Completa Final - Total, Interno e Externo

agrupador_atm_completo <- agrupador_atm %>%
    left_join(agrupador_atm_interno) %>%
    left_join(agrupador_atm_externo)
#_______________________________________________________________________________________________________

#Processamento Custo Médio

#__________________________________________

#CSV - CUSTO Total

agrupador_custo_bruto <- read.csv2(paste0(custo_total,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo <- which(agrupador_custo_bruto$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo <- agrupador_custo_bruto %>% 
    filter(row_number() > linha_agrupador_custo) %>%
    rename(Custo_Total = 2,
           Financeiro_custo_total = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Custo")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)

#____________________________

#CSV - CUSTO Interno

agrupador_custo_bruto_interno <- read.csv2(paste0(custo_interno,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo_interno <- which(agrupador_custo_bruto_interno$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo_interno <- agrupador_custo_bruto_interno %>% 
    filter(row_number() > linha_agrupador_custo_interno) %>%
    rename(Custo_Interno = 2,
           Financeiro_custo_interno = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Custo")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)

#____________________________

#CSV - CUSTO Externo

agrupador_custo_bruto_externo <- read.csv2(paste0(custo_externo,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo_externo <- which(agrupador_custo_bruto_externo$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo_externo <- agrupador_custo_bruto_externo %>% 
    filter(row_number() > linha_agrupador_custo_externo) %>%
    rename(Custo_Externo = 2,
           Financeiro_custo_externo = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Custo")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador)

#______________________________

# Custo Base Completa Final - Total, Interno e Externo

agrupador_custo_completo <- agrupador_custo %>%
    left_join(agrupador_custo_interno) %>%
    left_join(agrupador_custo_externo)

#_______________________________________________________________________________________________________

#Processamento Percentual Vincendo

#__________________________________________

#CSV - Percentual Vincendo

agrupador_percentual_vincendo_bruto <- read.csv2(paste0(percentual_vincendo,Novo_Periodo,".csv")) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_percentual_vincendo <- which(agrupador_percentual_vincendo_bruto$Inicio=="Agrupador")

#Processamento da Base com Percentual Vincendo das Garantias - Formatada

agrupador_percentual_vincendo <- agrupador_percentual_vincendo_bruto %>% 
    filter(row_number() > linha_agrupador_percentual_vincendo) %>%
    #rename(Custo_Total = 2,
     #      Financeiro_custo_total = 3) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Custo")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador) %>%
    rename (Ate_12_meses = 5,
            Ate_12_meses_percentual = 6,
            De_1_2_anos = 7,
            De_1_2_anos_percentual = 8,
            De_2_3_anos = 9,
            De_2_3_anos_percentual = 10,
            De_3_4_anos = 11,
            De_3_4_anos_percentual = 12,
            De_4_5_anos = 13,
            De_4_5_anos_percentual = 14,
            Acima_5_anos = 15,
            Acima_5_anos_percentual = 16,
            Total = 17,
            Total_percentual = 18
    )


#__________________________________________

#CSV - Honras Garantias




#_________________________________________________

#CSV - Novos Contratos




#___________________________



#____________________________

save(list = c("agrupador_atm_completo","agrupador_custo_completo","agrupador_percentual_vincendo","agrupador_total"),file = "Garantias.Rdata")



#____________________________________________________________________________________________________________

    

ui <- fluidPage(
)

server <- function(input, output) {
}


shinyApp(ui = ui, server = server)
