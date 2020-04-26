library(tidyverse)
library(extrafont)

data <- honras %>%
  select(date = `Data de Vencimento`,
         lender = `Credor`,
         borrower = `Mutuário`,
         amount_honoured = `Honra - Total (R$)`)

write.csv(data, file = "data.csv", fileEncoding = "UTF-8")
