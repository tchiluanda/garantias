library(tidyverse)
library(readxl)
library(jsonlite)

grid <- read_excel("grid_letras.xlsx", sheet = "export_5")

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


exportar <- gera_grid(new_grid)

exportar <- bind_rows(exportar, exportar, exportar, exportar)
exportar <- exportar[1:146,] %>%
  mutate(nome = paste("bolha", row_number()))

ggplot(exportar, aes(x = x, y = y)) + geom_point()

jsonlite::write_json(exportar, "grid_temp.json")