library(tidyverse)
library(lubridate)
library(extrafont)

data <- read.csv(file = "data.csv", fileEncoding = "UTF-8", 
                 stringsAsFactors = FALSE, )

highlighted_states <- c("Rio de Janeiro", "Minas Gerais")

dotplot_data <- data %>%
  select(-X) %>%
  mutate(date = ymd(date),
         date_month = ymd(paste(year(date), month(date), "01",sep = "-")),
         borrower_cat = ifelse(borrower %in% highlighted_states,
                               borrower,
                               "Other")) %>%
  arrange(date_month, match(borrower_cat, c(highlighted_states, "Other"))) %>%
  group_by(date_month) %>%
  mutate(dot_position = row_number()) %>%
  ungroup()

raw_plot <- ggplot(dotplot_data, aes(x = date_month, y = dot_position, color = borrower_cat)) +
  geom_point()

ggsave(filename = "raw_dotplot.png", plot = raw_plot, type = "cairo-png", width = 6.8, height = 5.18, dpi = 400)

my_theme <- function(){
  theme_minimal() +
    theme(
      text = element_text(family = "Merriweather Sans Light", colour = "#555555"),
      panel.grid.major = element_blank(), 
      panel.grid.minor = element_blank(),
      axis.text = element_text(size = 8),
      axis.line = element_line(color = "#555555", size = 0.3),
      axis.ticks = element_line(size = 0.2),
      axis.ticks.length = unit(.15, "cm"),
      legend.position = 'none')
}

dotplot <- ggplot(dotplot_data, aes(x = date_month, y = dot_position, color = borrower_cat)) +
  geom_point(size = 3) +
  labs(x = NULL, y = NULL) +
  scale_x_date(expand = c(0,15), date_breaks = "6 months", 
               date_labels = "%b %Y", limits = c(as.Date("2016-02-01"), NA)) +
  scale_y_continuous(expand = c(0,0), limits = c(0,40), breaks = seq(0,max(dotplot_data$dot_position),by=5)) +
  scale_color_manual(values = c("Rio de Janeiro" = "#ea5f94",
                                "Minas Gerais"   = "#9d02d7",
                                "Other"          = "#ffb14e")) +
  my_theme()

ggsave(filename = "dotplot.png", plot = dotplot, type = "cairo-png", width = 6.8, height = 5.18, dpi = 400)
