import type { ItemRecipes } from "../types/tft";
import data from "../../public/itemRecipes.json";

export const ITEM_RECIPES = data as unknown as ItemRecipes;
