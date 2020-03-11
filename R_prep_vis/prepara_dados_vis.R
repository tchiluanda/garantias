library(tidyverse)
library(lubridate)
library(stringr)
library(viridis)
library(colorspace)
library(extrafont)

#extrafont::font_import()
loadfonts()

load("R/Garantias_dez_2019.Rdata")


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
  mutate(interna_demais = interna_total - interna_cambial)

write.csv(quadro, file = "webpage/dados_quadro.csv", fileEncoding = "UTF-8")


# contratos ---------------------------------------------------------------

write.csv(novos_contratos, file = "webpage/contratos.csv", fileEncoding = "UTF-8")


# honras ------------------------------------------------------------------

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
         mes_ano = paste0(ano,mes))

honras_simples %>% filter(mutuario == "Rio de Janeiro") %>% group_by(mes_ano) %>% count()

honras_plot <- honras_simples %>%
  mutate(mutuario_cat = ifelse(mutuario == "Rio de Janeiro", "rio", "demais")) %>%
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

# beeswarm / unitplot de cada honra
ggplot(contagem_honras, aes(x = data_mes, y = ifelse(mutuario_cat == "rio", pos, -pos))) + geom_point()

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
