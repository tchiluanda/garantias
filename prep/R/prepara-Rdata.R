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
library(readr)
library(abjutils)

#Definição Pasta de Processamento dos Arquivos

#setwd("C:/Users/sara/Desktop/Lucas/GT-CEAD/Projetos/16. Painel Garantias - CODIV - SUDIP/R")

caminho <- './prep/R/dados-codiv/'

#___________________________________________________________________________________________

 numero <- function(x){
  
  a <- as.character(x)
  b <- str_replace_all(a,"\\.","")
  c <- str_replace_all(b,",","\\.")
  d <- as.numeric(c)
  
  return(d)
 }
 
 #Função Para Remover Acentos
 
 remove_acento <- function(str,pattern="all") {
   if(!is.character(str))
     str <- as.character(str)
   
   pattern <- unique(pattern)
   
   if(any(pattern=="Ç"))
     pattern[pattern=="Ç"] <- "ç"
   
   symbols <- c(
     acute = "áéíóúÁÉÍÓÚýÝ",
     grave = "àèìòùÀÈÌÒÙ",
     circunflex = "âêîôûÂÊÎÔÛ",
     tilde = "ãõÃÕñÑ",
     umlaut = "äëïöüÄËÏÖÜÿ",
     cedil = "çÇ"
   )
   
   nudeSymbols <- c(
     acute = "aeiouAEIOUyY",
     grave = "aeiouAEIOU",
     circunflex = "aeiouAEIOU",
     tilde = "aoAOnN",
     umlaut = "aeiouAEIOUy",
     cedil = "cC"
   )
   
   accentTypes <- c("´","`","^","~","¨","ç")
   
   if(any(c("all","al","a","todos","t","to","tod","todo")%in%pattern)) # opcao retirar todos
     return(chartr(paste(symbols, collapse=""), paste(nudeSymbols, collapse=""), str))
   
   for(i in which(accentTypes%in%pattern))
     str <- chartr(symbols[i],nudeSymbols[i], str)
   
   return(str)
 }
 
 #___________________________________________________________
 
##########

#Novo período (Data) - Último Quadrimestre

Novo_Periodo <- as.character("30abr2022") #alterar essa data para atualizar processamento dos dados

#Radical Dados Garantias Totais 

total <- as.character("Comp Indx ")

atm_total   <- as.character("ATM IntExt ")

atm_interno   <- as.character("ATM Int ")

atm_externo   <- as.character("ATM Ext ")

custo_total <- as.character("CustoMed IntExt ")

custo_interno <- as.character("CustoMed Int ")

custo_externo <- as.character("CustoMed Ext ")

percentual_vincendo <- as.character("PercVinc ")

credores <- as.character("EstTranche ")




#_________________________________________________________________________________

# Processamento - Garantias Totais, Interna e Externa; Data de REferência

#CSV - Total de Garantias

tam_cabecalho <- 11

cabecalho <- read.csv2(paste0(caminho,total,Novo_Periodo,".csv"), 
                       encoding = "latin1", 
                       nrows = tam_cabecalho) %>%
  rename(Inicio = 1) 

agrupador_total_bruto <- read.csv2(paste0(caminho,total,Novo_Periodo,".csv"), 
                                   encoding = "latin1", 
                                   skip = tam_cabecalho) %>%
        rename(Inicio = 1) 
        

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)
        
linha_agrupador_total <- which(agrupador_total_bruto$Inicio=="Agrupador")

#Obtenção da Data de Referência da Base de Dados

data_referencia_total <- cabecalho$Inicio[which(str_detect(cabecalho$Inicio, "Data de Referência:"))]

data_referencia <- as.Date(str_sub(data_referencia_total,21,str_length(data_referencia_total)),"%d/%m/%Y" )

#Processamento da Base com total de Garantias - Formatada

lista_agrupador <- c("Garantia Total","Todas","Estados", "Bancos Federais", "Municípios","Estatais Federais","Entidades Estaduais Controladas","Empresas Privatizadas")


agrupador_total <- agrupador_total_bruto %>% 
    filter(row_number() >= linha_agrupador_total) %>%
    rename(total_total=2,
                         total_IPCA=4, 
                         total_selic=8, 
                         total_TJLP = 10, 
                         total_TR=12,
                         total_cambial=14,
                         total_nao_indexado=16,
                         interna_total=18,
                         interna_USD=20,
                         interna_IPCA=22,
                         interna_selic=26,
                         interna_TJLP=28,
                         interna_TR=30,
                         interna_nao_indexado=32,
                         externa_total=34,
                         externa_USD=36,
                         externa_EUR=38,
                         externa_JPY=40,
                         externa_demais=42) %>%
    mutate(Inicio = as.character(Inicio), 
           Classificador = ifelse(Inicio %in% lista_agrupador,Inicio, NA),
           Periodo = data_referencia,
           Grupo = as.character("Total")) %>%
    select(Inicio, Classificador,Grupo,Periodo,everything()) %>%
    fill(Classificador) %>%
    mutate(Inicio = rm_accent(Inicio)) %>%
    mutate(Classificador = rm_accent(Classificador))
#___________________________________________________________________________________________________________    
    
# Processamento - ATM (Avarage Time to Maturity) - TOTAl

#CSV - ATM Total

agrupador_atm_bruto <- read.csv2(paste0(caminho,atm_total,Novo_Periodo,".csv"), 
                                 encoding = "latin1", skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm <- 1#which(agrupador_atm_bruto$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm <- agrupador_atm_bruto %>% 
    filter(row_number() >= linha_agrupador_atm) %>%
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

agrupador_atm_bruto_interno <- read.csv2(
  paste0(caminho,atm_interno,Novo_Periodo,".csv"), 
  encoding = "latin1",
  skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm_interno <- 1#which(agrupador_atm_bruto_interno$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm_interno <- agrupador_atm_bruto_interno %>% 
    filter(row_number() >= linha_agrupador_atm_interno) %>%
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

agrupador_atm_bruto_externo <- read.csv2(
  paste0(caminho,atm_externo,Novo_Periodo,".csv"), 
  encoding = "latin1",
  skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_atm_externo <- 1#which(agrupador_atm_bruto_externo$Inicio=="Agrupador")

#Processamento da Base com ATM das Garantias - Formatada

agrupador_atm_externo <- agrupador_atm_bruto_externo %>% 
    filter(row_number() >= linha_agrupador_atm_externo) %>%
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
    left_join(agrupador_atm_externo) %>%
    mutate(Inicio = rm_accent(Inicio)) %>%
    mutate(Classificador = rm_accent(Classificador))
#_______________________________________________________________________________________________________

#Processamento Custo Médio

#__________________________________________

#CSV - CUSTO Total

agrupador_custo_bruto <- read.csv2(paste0(caminho,custo_total,Novo_Periodo,".csv"), encoding = "latin1", skip=tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo <- 1#which(agrupador_custo_bruto$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo <- agrupador_custo_bruto %>% 
    filter(row_number() >= linha_agrupador_custo) %>%
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

agrupador_custo_bruto_interno <- read.csv2(paste0(caminho,custo_interno,Novo_Periodo,".csv"), encoding = "latin1", skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo_interno <- 1#which(agrupador_custo_bruto_interno$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo_interno <- agrupador_custo_bruto_interno %>% 
    filter(row_number() >= linha_agrupador_custo_interno) %>%
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

agrupador_custo_bruto_externo <- read.csv2(paste0(caminho,custo_externo,Novo_Periodo,".csv"), encoding = "latin1", skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_custo_externo <- 1#which(agrupador_custo_bruto_externo$Inicio=="Agrupador")

#Processamento da Base com Custo das Garantias - Formatada

agrupador_custo_externo <- agrupador_custo_bruto_externo %>% 
    filter(row_number() >= linha_agrupador_custo_externo) %>%
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
    left_join(agrupador_custo_externo) %>%
     mutate(Inicio = rm_accent(Inicio)) %>%
  mutate(Classificador = rm_accent(Classificador))

#_______________________________________________________________________________________________________

#Processamento Percentual Vincendo

#__________________________________________

#CSV - Percentual Vincendo

agrupador_percentual_vincendo_bruto <- read.csv2(paste0(caminho,percentual_vincendo,Novo_Periodo,".csv"), encoding = "latin1", skip = tam_cabecalho) %>%
    rename(Inicio = 1) 

#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_percentual_vincendo <- 1#which(agrupador_percentual_vincendo_bruto$Inicio=="Agrupador")

#Processamento da Base com Percentual Vincendo das Garantias - Formatada

agrupador_percentual_vincendo <- agrupador_percentual_vincendo_bruto %>% 
    filter(row_number() >= linha_agrupador_percentual_vincendo) %>%
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
    ) %>%
  mutate(Inicio = rm_accent(Inicio)) %>%
  mutate(Classificador = rm_accent(Classificador))


#Processamento Credores

#__________________________________________

#CSV - Credores

agrupador_credores_bruto <- read.csv2(
  paste0(caminho,credores,Novo_Periodo,".csv"), 
  encoding = "latin1", skip = tam_cabecalho, row.names = NULL) %>%
  rename(Inicio = 1) 

# #gambiarra na pressa
# colnames(agrupador_credores_bruto) <- c("Inicio", colnames(agrupador_credores_bruto)[-1:-2])
# agrupador_credores_bruto <- agrupador_credores_bruto[,1:26]


#Número linha agregador (definição até que linha deve ser ignorada para iniciar processamento)

linha_agrupador_credores <- 1#which(agrupador_credores_bruto$Inicio=="Nome do Contrato")

#Processamento da Base com Credores - Formatados

agrupador_credores <- agrupador_credores_bruto %>% 
  filter(row_number() >= linha_agrupador_credores)%>%
  rename(Tipo_Divida = 4, 
         Mutuario = 5,
         Tipo_Mutuario = 6,
         UF = 7,
         Credor = 11,
         Saldo_Principal = 24) %>%
  select(Tipo_Mutuario, Mutuario, UF, Credor, Tipo_Divida,Saldo_Principal) %>%
   mutate(
     Saldo_Principal = numero(Saldo_Principal),
     Mutuario = remove_acento(Mutuario),
     Tipo_Mutuario = remove_acento(Tipo_Mutuario)
   ) 
  

  #filter(grepl("Toledo", Mutuario)) %>%
  #group_by(Credor, Mutuario, Tipo_Divida, Tipo_Mutuario) %>%
  #summarise(Saldo_Principal = sum(Saldo_Principal))

#__________________________________________

#CSV - Honras Garantias

honras <- read_delim(paste0(caminho,"Relatorio_honras_atrasos 30abr2022.csv"), 
                     ";", escape_double = FALSE, locale = locale(date_format = "%d/%m/%Y", 
                                                                 decimal_mark = ",", grouping_mark = ".", 
                                                                 encoding = "LATIN1"), trim_ws = TRUE, 
                     skip = 10)


#_________________________________________________

#CSV - Novos Contratos

novos_contratos <- read_delim(paste0(caminho,"InfCadastrais 30abr2022.csv"), 
                     ";", escape_double = TRUE, locale = locale(date_format = "%d/%m/%y", 
                                                                 decimal_mark = ",", grouping_mark = ".", 
                                                                 encoding = "LATIN1"), trim_ws = TRUE, 
                     
                     skip = 10)  
  
                    


novos_contratos <- novos_contratos %>%
                   mutate(Mutuario = rm_accent(`Mutuário`),
                          `Valor Contratado Original` = (`Valor Contratado Original`/1000000),
                          Assinatura = as.Date(`Data de Assinatura`, origin="1899-12-30", format ="%d/%m/%Y"),
                          Ano = year(Assinatura),
                          Status = ifelse(Fase == "Concluído","Concluido","Ativo")) %>%
                   mutate(Tipo_Mutuario = rm_accent(`Tipo Mutuário`)) %>%
                   rename(Moeda = 22,
                          Tipo = 9 )
                   
novos_contratos$Tipo_Mutuario <- ifelse(novos_contratos$Tipo_Mutuario =="Entidades Estaduais Controladas", 
                          "Entidades Controladas",
                          novos_contratos$Tipo_Mutuario)
#___________________________



#____________________________

save(list = c("data_referencia","honras","novos_contratos","agrupador_atm_completo","agrupador_custo_completo","agrupador_percentual_vincendo","agrupador_total", "agrupador_credores"),file = "Garantias_abr_2022.Rdata")

#save(list = c("honras"),file = "Honras_mai_2020.Rdata")


#____________________________________________________________________________________________________________

    

ui <- fluidPage(
)

server <- function(input, output) {
}


shinyApp(ui = ui, server = server)
