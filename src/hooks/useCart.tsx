import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockResponse = await api.get<Stock>(`stock/${productId}`);
      const stockAmount = stockResponse.data.amount;
      if (stockAmount <= 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const existedProduct = cart.find(({ id }) => id === productId);

      if (existedProduct) {
        const newCart = cart.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1,
            };
          }
          return product;
        });
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        return;
      }

      const productResponse = await api.get(`products/${productId}`);
      const product: Product = {
        id: productResponse.data.id,
        title: productResponse.data.title,
        price: productResponse.data.price,
        image: productResponse.data.image,
        amount: 1,
      };

      const newCart = [...cart, product];

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existedProduct = cart.find(({ id }) => id === productId);
      if (!existedProduct) {
        toast.error("Erro na remoção do produto");
        return;
      }
      const newCart = cart.filter(({ id }) => !(id === productId));
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }
      const stockResponse = await api.get<Stock>(`stock/${productId}`);
      const stockAmount = stockResponse.data.amount;
      if (stockAmount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: amount,
          };
        }
        return product;
      });
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
