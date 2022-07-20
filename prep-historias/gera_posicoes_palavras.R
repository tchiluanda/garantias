library(tidyverse)
library(readxl)
#library(jsonlite)

grid <- read_excel("./R_prep_vis/grid_letras.xlsx", sheet = "export", skip = 0)

new_grid <- as.data.frame(grid[,-1])

gera_grid <- function(grid_inicial) {
  
  coordenadas <- data.frame()
  
  n <- 1
  
  for (x in 1:dim(grid_inicial)[2]) {
    for (y in 1:dim(grid_inicial)[1]) {
      if (!is.na(grid_inicial[y,x])) {
        #print(paste(y,x))
        coordenadas[n,1] <- x
        coordenadas[n,2] <- y
        n <- n+1
      }
    }
  }
  
  coordenadas_export <- coordenadas %>%
    rename(x = V1,
           y = V2) %>%
    mutate(nome = paste("bolha", row_number()))
  
  return(coordenadas_export)
}


exportar <- gera_grid(grid)
#exportar_copy <- exportar[824,]

#exportar <- bind_rows(exportar, exportar_copy)
# exportar <- exportar[1:825-757,] %>%
#   mutate(nome = paste("bolha", row_number()))

ggplot(exportar, aes(x = x, y = y)) + geom_point()  + scale_y_reverse()
#jsonlite::write_json(exportar, "grid_honras.json")
write.csv(exportar, file = "webpage/dados/grid_honras.csv")

## experimentos

max(exportar$y)

ggplot(exportar, aes(x, y)) + geom_raster() + scale_y_reverse()
ggplot(exportar, aes(x, y)) + geom_point(size = 4) + scale_y_reverse()
ggplot(exportar, aes(x, y)) + geom_hex(bins = c(43,52)) + scale_y_reverse()
ggplot(exportar, aes(x, y)) + geom_polygon(aes(group = nome)) + scale_y_reverse()

# cores
coral        <- rgb(255/255, 99/255, 79/255)
amarelo      <- rgb(255/255,227/255, 76/255)
cinza_claro  <- rgb(183/255,177/255,165/255)
cinza_medio  <- rgb(118/255,113/255,107/255)
cinza_escuro <- rgb( 51/255, 51/255, 51/255)

cores <- c(coral, amarelo, cinza_claro, cinza_medio, cinza_escuro)

exportar_cores <- exportar %>% rowwise() %>% mutate(cor = sample(cores, 1))

ggplot(exportar_cores, aes(x, y, color = cor)) + geom_point(size = 2) + scale_y_reverse() + scale_color_identity()
ggplot(exportar_cores, aes(x, y, fill = cor)) + geom_raster() + scale_y_reverse() + scale_fill_identity()


logo <- ggplot(exportar_cores, aes(x, y)) + geom_tile(fill = cinza_medio, color = cinza_escuro) + scale_y_reverse() + theme_minimal() + theme(axis.title = element_blank(), axis.text = element_blank(), axis.line = element_blank(), panel.grid = element_blank())

ggsave(logo, filename = "logo_px.png", width = 5.2, height = 4.3, dpi = 300, type = "cairo-png", bg = "transparent")
