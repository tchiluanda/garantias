library(tidyverse)
library(lubridate)
library(stringr)
library(viridis)
library(colorspace)
library(extrafont)
library(padr)

#extrafont::font_import()
loadfonts()

load("R/Garantias_dez_2019.Rdata")


# investigacao honras x contratos -----------------------------------------

honras_unicas <- honras %>%
  count(`Nome do Contrato`)

teste <- novos_contratos %>% left_join(honras_unicas)

teste %>% filter(!is.na(n)) %>% count()

honras_unicas %>% left_join(novos_contratos) %>% filter(is.na(`Mutuário`))

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
  right_join(dados_vis_pre) %>%
  mutate(Classificador = ifelse(Classificador == "Entidades Estaduais Controladas",
                                "Entidades Controladas",
                                Classificador))

write.csv(dados_vis, file = "webpage/dados_vis_garantias.csv", fileEncoding = "UTF-8")

total_classificador <- dados_vis %>% group_by(Classificador) %>% summarize(first(total_classificador))

save(total_classificador, file = "total_garantias_classificador.RData")

dados_vis %>% filter(rank_geral>=16) %>% group_by() %>% summarise(sum(valor))


# Dados Quadro ------------------------------------------------------------

quadro <- list(
  
  agrupador_total %>%
    select(Inicio, Classificador, Periodo,
           total_total,
           interna_cambial = interna_USD, 
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
        as.character(.), "\\.", ""), ",", "\\."))) %>%
  mutate(interna_demais = interna_total - interna_cambial,
         Classificador = ifelse(Classificador == "Entidades Estaduais Controladas",
                                "Entidades Controladas",
                                Classificador))  %>%
  arrange(Classificador, Inicio)

write.csv(quadro, file = "webpage/dados_quadro.csv", fileEncoding = "UTF-8")


# contratos ---------------------------------------------------------------

#lista_contratos <- novos_contratos %>% count(Mutuário)
contratos <- read.csv2("Garantias_Dados/Dez2019/InfCadastrais 31dez2019.csv", 
                       skip = 10, stringsAsFactors = FALSE)

# arq_contratos <- novos_contratos %>%  
#   mutate(Inicio = rm_accent(`Mutuário`),
#          Classificador = rm_accent(`Tipo Mutuário`)) %>%
#   filter(Inicio %in% dados_vis$Inicio) %>%
#   select(Inicio, 
#          Classificador, 
#          UF, 
#          Credor, 
#          tipo_credor = `Classificação de Credor`,
#          Projeto,
#          data = `Data de Assinatura`,
#          Moeda,
#          valor = `Valor Contratado Original`) %>%
#   mutate(data_date = lubridate::dmy(data)) %>%
#   arrange(Classificador, Inicio, data_date)
  
arq_contratos <- contratos %>%  
  mutate(Inicio = rm_accent(`Mutuário`),
         Classificador = rm_accent(`Tipo.Mutuário`)) %>%
  filter(Inicio %in% dados_vis$Inicio) %>% # (1)
  left_join(honras_unicas, by = c("Nome.do.Contrato" = "Nome do Contrato")) %>%
  select(Inicio, 
         Classificador, 
         UF, 
         Credor, 
         tipo_credor = `Classificação.de.Credor`,
         Projeto,
         honras = n,
         data = `Data.de.Assinatura`,
         Moeda = `Moeda.de.Origem`,
         valor = `Valor.Contratado.Original`) %>%
  mutate(data_date = lubridate::dmy(data),
         valor = as.numeric(
           str_replace(str_replace_all(valor, "\\.", ""),
                       ",", ".")),
         Projeto = str_replace_all(Projeto, "¿", "-"),
         Classificador = ifelse(Classificador == "Entidades Estaduais Controladas",
                                "Entidades Controladas",
                                Classificador)) %>%
  arrange(Classificador, Inicio, desc(data_date))

# (1) isso pq o arquivo de contratos traz coisas que foram feitas em 2020, então
# achei melhor cortar. acho.

write.csv(arq_contratos, file = "webpage/dados/contratos.csv", fileEncoding = "UTF-8")

arq_contratos %>% count(Inicio, sort = TRUE)

novos_contratos %>%
  group_by(`Tipo Mutuário`) %>%
  summarise(sum(`Saldo Devedor`), sum(`Saldo a Desembolsar`)) %>%
  janitor::adorn_totals("row")

dados_vis_pre %>% group_by(Classificador) %>% summarise(sum(valor))

### verificacao

lista_garantias_mutuarios <- dados_vis %>%
  group_by(Classificador, Inicio) %>%
  summarise(qde_garantias = n()) %>%
  ungroup() %>%
  mutate(tipo = "garantias")
  

lista_contratos_mutuarios <- novos_contratos %>%
  mutate(`Mutuário` = rm_accent(`Mutuário`),
         `Tipo Mutuário` = rm_accent(`Tipo Mutuário`)) %>%
  group_by(`Tipo Mutuário`, `Mutuário`) %>%
  summarise(qde_contratos = n()) %>%
  ungroup() %>%
  mutate(tipo = "contratos")

lista_unica <- full_join(lista_garantias_mutuarios,
                         lista_contratos_mutuarios,
                         by = c("Classificador" = "Tipo Mutuário", "Inicio" = "Mutuário"))

# honras: dados para viz --------------------------------------------------

honras_simples <- honras %>%
  select(data = `Data de Vencimento`,
         tipo_divida = `Tipo de Dívida`,
         `Credor`,
         tipo_credor = `Classificação do Credor`,
         mutuario = `Mutuário`,
         tipo_mutuario = `Tipo de Mutuário`,
         `Status`,
         valor = `Honra - Total (R$)`) %>%
  as.data.frame() %>%
  mutate(mes = str_pad(month(data), width = 2, pad = "0"),
         ano = year(data),
         mes_ano = paste0(ano,mes),
         mutuario_cat = case_when(
           mutuario == "Rio de Janeiro" ~ "Estado do Rio de Janeiro",
           mutuario == "Minas Gerais" ~ "Minas Gerais",
           TRUE ~ "Demais entes"),
         estados = if_else(tipo_mutuario == "Municípios", "Municípios", mutuario))
          

honras_simples %>% filter(mutuario == "Rio de Janeiro") %>% group_by(mes_ano) %>% count()

contagem_honras_avancado <- honras_simples %>%
  group_by(Credor) %>%
  mutate(qde_credor = n()) %>%
  ungroup() %>%
  mutate(credor_cat = ifelse(qde_credor < 20, "Demais credores", Credor)) %>%
  #arrange(mes_ano, desc(mutuario_cat)) %>%
  arrange(mes_ano, match(mutuario_cat, c("Estado do Rio de Janeiro", "Minas Gerais", "Demais entes"))) %>%
  mutate(data_mes = as.Date(paste(str_sub(mes_ano, 1, 4),
                                  str_sub(mes_ano, 5, 6),
                                  "01", sep = "-"))) %>%
  group_by(data_mes) %>%
  mutate(pos = row_number()) %>%
  ungroup()

rank_honras_cat <- contagem_honras_avancado %>%
  group_by(credor_cat) %>%
  summarise(soma_credor_cat = sum(valor)) %>%
  ungroup() %>%
  mutate(rank_credor_cat = rank(-soma_credor_cat))

rank_honras_tip <- contagem_honras_avancado %>%
  group_by(tipo_divida) %>%
  summarise(soma_credor_tip = sum(valor)) %>%
  ungroup() %>%
  mutate(rank_credor_tip = rank(-soma_credor_tip)) 

honras_det <- contagem_honras_avancado %>%
  left_join(rank_honras_cat) %>%
  left_join(rank_honras_tip)

honras_det %>% group_by(Credor) %>% summarise(soma = sum(valor), qde = n()) %>% arrange(desc(soma))

## para streamgraph

honras_agg <- contagem_honras_avancado %>%
  group_by(data_mes, mutuario_cat) %>%
  summarise(valor_mes = sum(valor),
            qde = n()) %>%
  ungroup() %>%
  gather(valor_mes, qde, key = "tipo_valor", value = "valor") %>% #(1)
  spread(mutuario_cat, value = valor) %>%
  pad(by = "data_mes", interval = "month") %>%
  gather(-c(data_mes, tipo_valor), key = mutuario_cat, value = valor) %>%
  spread(tipo_valor, value = valor) %>%
  replace_na(list(qde = 0, valor_mes = 0)) %>%
  group_by(mutuario_cat) %>%
  mutate(valor_acum = cumsum(valor_mes))

#(1): faço essa combinação de gathers e spread para "preencher" os valores
#     de todas as categorias para todos os meses.



## exporta

write.csv(honras_det, file = "webpage/dados/dados_honras_det.csv", fileEncoding = "UTF-8")
write.csv(honras_agg, file = "webpage/dados/dados_honras_agg.csv", fileEncoding = "UTF-8")

## prototipos de plots

#small multiples
small <- honras_simples %>%
  mutate(data_mes = as.Date(paste(str_sub(mes_ano, 1, 4),
                                  str_sub(mes_ano, 5, 6),
                                  "01", sep = "-"))) %>%
  group_by(estados, data_mes) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(valor_ac = cumsum(valor))

ggplot(small, aes(x = data_mes, y = valor)) +
  geom_line() +
  facet_wrap(~estados) +
  scale_y_continuous(labels = function(x){format(x/1e6, big.mark = ".", 
                                                 decimal.mark = ",")}) +
  theme_minimal()

#areachart
ggplot(honras_agg, aes(x = data_mes, y = valor_acum, fill = mutuario_cat)) +
  geom_area() +
  theme(legend.position = "bottom") + 
  scale_y_continuous(labels = function(x){format(x/1e6, big.mark = ".", 
                                                  decimal.mark = ",")})

#barchart agregado
ggplot(honras_agg, aes(x = data_mes, y = valor_acum, fill = mutuario_cat)) +
  geom_col() +
  theme(legend.position = "bottom")

#areachart mensal
ggplot(honras_agg, aes(x = data_mes, y = valor_mes, fill = mutuario_cat)) +
  geom_area() +
  theme(legend.position = "bottom")

#barchart mensal
ggplot(honras_agg, aes(x = data_mes, y = valor_mes, fill = mutuario_cat)) +
  geom_col() +
  theme(legend.position = "bottom")

#areachart qde
ggplot(honras_agg, aes(x = data_mes, y = qde, fill = mutuario_cat)) +
  geom_area() +
  geom_point(data = honras_det, aes(x = data_mes, color = mutuario_cat, y = pos)) +  
  scale_color_manual(values = c("firebrick", "steelblue"))
  theme(legend.position = "bottom")

#unit
ggplot() +
  geom_col(data = honras_agg, aes(x = data_mes, y = qde, fill = mutuario_cat)) +
  geom_point(data = honras_det, aes(x = data_mes, color = mutuario_cat, y = pos)) +  
  scale_color_manual(values = c("firebrick", "steelblue"))


# honras: outros plots e experimentos -------------------------------------



honras_plot <- honras_simples %>%
  group_by(mes_ano, mutuario, mutuario_cat) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  arrange(mes_ano) %>%
  mutate(data = as.Date(paste(str_sub(mes_ano, 1, 4),
                              str_sub(mes_ano, 5, 6),
                              "01", sep = "-"))) %>%
  group_by(mutuario, mutuario_cat) %>%
  mutate(total_mutuario = sum(valor)) %>%
  ungroup() %>%
  mutate(ente = fct_reorder(mutuario, total_mutuario)) 

contagem_honras <- honras_simples %>%
  mutate(mutuario_cat = ifelse(mutuario == "Rio de Janeiro", "rio", "demais")) %>%
  arrange(mes_ano) %>%
  mutate(data_mes = as.Date(paste(str_sub(mes_ano, 1, 4),
                                  str_sub(mes_ano, 5, 6),
                                  "01", sep = "-"))) %>%
  group_by(data_mes, mutuario_cat) %>%
  mutate(pos = row_number())


contagem_honras_simples <- contagem_honras_avancado %>%
  group_by(data_mes, mutuario_cat) %>%
  count()

# beeswarm / unitplot de cada honra
ggplot(contagem_honras, aes(x = data_mes, y = ifelse(mutuario_cat == "rio", pos, -pos))) + geom_point()

# beeswarm / unitplot de cada honra, empilhados
ggplot(contagem_honras_export, aes(x = data_mes, y = pos, color = mutuario_cat)) + geom_point()

### vai pro D3
# barchart contagem + unitplot
ggplot(contagem_honras_simples, aes(x = data_mes, y = n, fill = mutuario_cat)) + geom_col() + 
  geom_point(data = contagem_honras_export, aes(x = data_mes, y = pos, color = mutuario_cat)) +
  scale_color_manual(values = c("firebrick", "steelblue"))
scale_color


#%>% filter(!(mutuario %in% c("Rio de Janeiro", "Minas Gerais", "Goiás"))

ggplot(honras_plot, aes(y = valor, x = data)) + 
  geom_col() + 
  coord_polar(theta = "x") +
  scale_x_date(limits = c(as.Date("2016-01-01"), NA), date_breaks = "1 year",
               date_labels = "%Y") +
  scale_y_continuous(limits = c(-4e8, NA)) +
  geom_hline(yintercept = 0, color = "lightgrey") +
  facet_wrap(~mutuario) +
  theme_minimal() +
  theme(axis.line = element_blank(),
        axis.text.y = element_blank(),
        axis.ticks = element_blank(),
        axis.title = element_blank(),
        panel.grid = element_blank())

honras_plot_acum <- honras_plot %>%
  arrange(data) %>%
  group_by(data, mutuario_cat) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  group_by(mutuario_cat) %>%
  mutate(valor_acum = cumsum(valor))


honras_plot_acum %>% filter(mutuario != "Rio de Janeiro")

# "streamgraph"
ggplot(honras_plot_acum, 
       aes(x = data, 
           y = ifelse(mutuario_cat == "rio", valor_acum, -valor_acum), 
           fill = mutuario_cat)) + 
  geom_line() +
  geom_area() +
  geom_col(aes(y = ifelse(mutuario_cat == "rio", valor, -valor)), fill = "goldenrod") +
  theme_minimal()

### vai pro D3
# area graph
ggplot(honras_plot_acum, 
       aes(x = data, 
           y = valor_acum, 
           fill = mutuario_cat)) + 
  geom_area() +
  theme_minimal()

### vai pro D3
# barchart
ggplot(honras_plot_acum, 
       aes(x = data, 
           y = valor, 
           fill = mutuario_cat)) + 
  geom_col() +
  theme_minimal()

# barchart_contagem
ggplot(contagem_honras2, 
       aes(x = data,
           fill = mutuario_cat,
           y = pos)) + 
  geom_bar() +
  theme_minimal()

ggplot(honras_plot) + geom_histogram(aes(valor), bins = 100)



summary(honras_plot$valor)

ggplot(honras_plot, aes(y = mutuario, x = mes_ano)) + geom_point()

plot_honras1 <- ggplot(honras_plot, aes(y = ente, x = data, fill = valor)) + 
  geom_tile(width = 30, height = 1, color = "white", size = 1) +
  # geom_text(x = max(honras_plot$data) + 90, y = length(unique(honras_plot$mutuario)) + 1, label = "Totais", 
  #           family = "Merriweather Sans Light", size = 2.5, 
  #           hjust = 0, fontface = "bold", vjust = 1) + 
  # geom_text(x = max(honras_plot$data) + 90, 
  #           aes(label = format(round(total_mutuario/1e6, 0), big.mark = ".",
  #                              decimal.mark = ",")),
  #           family = "Merriweather Sans Light", size = 2.5, 
  #           hjust = "left", check_overlap = TRUE, vjust = "bottom", angle = 60) +
  scale_x_date(limits = c(as.Date("2015-12-01"), NA), date_breaks = "4 months",
               date_labels = "%b\n%Y") +
  scale_fill_continuous_sequential(palette = "BluGrn", 
                                   labels = function(x){format(x/1e6, big.mark = ".", decimal.mark = ",")}) +
  #scale_fill_viridis_c(direction = -1) +
  coord_flip(clip = "off") +
  labs(fill = NULL) +
  theme_minimal() +
  theme(axis.line = element_blank(),
        axis.ticks.y = element_blank(),
        axis.title = element_blank(),
        axis.text.y = element_text(size = 6),
        axis.text.x = element_text(size = 6, angle = -60, vjust = 0, hjust = 0),
        panel.grid = element_blank(),
        legend.position = "right",
        text = element_text(family = "Merriweather Sans Light"),
        legend.text = element_text(size = 7),
        plot.margin = margin(.75, 1.5, .25, .25, "cm"))

ggsave(filename = "honras1.png", plot = plot_honras1, width = 4, height = 10, bg = "transparent")

honras_simples %>% group_by(mutuario, tipo_mutuario) %>% summarise(sum(valor), n())






# uteis -------------------------------------------------------------------

rm_accent <- function(str,pattern="all") {
  # Rotinas e funções úteis V 1.0
  # rm.accent - REMOVE ACENTOS DE PALAVRAS
  # Função que tira todos os acentos e pontuações de um vetor de strings.
  # Parâmetros:
  # str - vetor de strings que terão seus acentos retirados.
  # patterns - vetor de strings com um ou mais elementos indicando quais acentos deverão ser retirados.
  #            Para indicar quais acentos deverão ser retirados, um vetor com os símbolos deverão ser passados.
  #            Exemplo: pattern = c("´", "^") retirará os acentos agudos e circunflexos apenas.
  #            Outras palavras aceitas: "all" (retira todos os acentos, que são "´", "`", "^", "~", "¨", "ç")
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
