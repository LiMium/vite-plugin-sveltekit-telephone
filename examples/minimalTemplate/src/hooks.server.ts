import type { ServerInit } from "@sveltejs/kit";
// import { config } from 'telefunc'

export const init: ServerInit = async () => {
  console.info("Server created")

  // config.disableNamingConvention = true
};
