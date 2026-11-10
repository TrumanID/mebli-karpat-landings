/** "preview" shows TODO markers and the example-price banner; "production" hides them and refuses unconfirmed data. */
export const isProduction = import.meta.env.PUBLIC_STAGE === 'production';
