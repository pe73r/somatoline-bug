window.customElements.define("cart-progress-step", class CartProgressStep extends HTMLElement {});
window.customElements.define(
  "cart-progress-bar",
  class CartProgressBar extends HTMLElement {
    constructor() {
      super();
    }

    async connectedCallback() {
      document.addEventListener("cart:updated", this.onCartUpdated);

      const res = await fetch("/cart.js");
      const cart = await res.json();
      console.log({ cart });
      await this.onCartUpdated({ detail: { cart } });
      console.log("ici", this.dataset.steps);
    }

    addProducts = (ids) => {
      return fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          items: ids.map((id) => ({
            id,
            quantity: 1,
            properties: {
              isFree: "true"
            }
          }))
        })
      });
    };

    onCartUpdated = async ({ detail: { cart } }) => {
      if (this.updating) return;

      this.updating = true;

      const CARD_ID = 42865099997423;
      const PRODUCT_ID = 42833756717295;
      const DISCOUNT_FOR_CARD = 10000;
      const DISCOUNT_FOR_PRODUCT = 15000;
      console.log(cart);
      const shouldAddCard = cart.items_subtotal_price >= DISCOUNT_FOR_CARD;
      const shouldAddProduct = cart.items_subtotal_price >= DISCOUNT_FOR_PRODUCT;

      const hasCard = cart.items.some((item) => item.variant_id === CARD_ID && !!item.properties.isFree);
      const hasProduct = cart.items.some((item) => item.variant_id === PRODUCT_ID && !!item.properties.isFree);

      console.log({ shouldAddCard, hasCard, hasProduct, shouldAddProduct });

      let hasChanged = false;
      let updates = {};
      let add = [];
      if (!hasCard && shouldAddCard) {
        add.push(CARD_ID);
      } else if (hasCard && !shouldAddCard) {
        Object.assign(updates, { [CARD_ID]: 0 });
      }

      if (!hasProduct && shouldAddProduct) {
        add.push(PRODUCT_ID);
      } else if (hasProduct && !shouldAddProduct) {
        Object.assign(updates, { [PRODUCT_ID]: 0 });
      }

      if (add.length) {
        console.log("add", add);
        await this.addProducts(add);
        hasChanged = true;
      }
      if (Object.keys(updates).length) {
        console.log("udpates");
        await fetch("/cart/update.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            updates
          })
        });
        hasChanged = true;
      }

      if (hasChanged) {
        await fetch("/cart.js");
        document.documentElement.dispatchEvent(
          new CustomEvent("cart:refresh", {
            bubbles: true
          })
        );
      }
      this.updating = false;
    };
  }
);
