import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// Tạo thunk để lấy dữ liệu giỏ hàng từ API
export const fetchCartFromAPI = createAsyncThunk(
    'shop/fetchCartFromAPI',
    async (_, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) {
                return { items: [] };
            }
            
            const apiUrl = process.env.domainApi || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/customer/cart/${customerId}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (data.success && data.data?.items) {
                return data.data;
            } else {
                return { items: [] };
            }
        } catch (error) {
            console.error('Error fetching cart data:', error);
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    cart: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
};

export const shopSlice = createSlice({
    name: "shop",
    initialState,
    reducers: {
        addCart: (state, { payload }) => {
            const isCartExist = state.cart.some(
                (item) => item.id === payload.product.id
            );
            if (!isCartExist) {
                state.cart.push({
                    ...payload.product,
                    qty: payload?.qty ? payload.qty : 1,
                });
                toast.success("This item added to cart.");
            } else {
                toast.error("This item is already in the cart.");
            }
            localStorage.setItem("local-cart", JSON.stringify(state.cart));
        },
        deleteCart: (state, { payload }) => {
            state.cart = state.cart.filter((item) => item.id !== payload);
            localStorage.setItem("local-cart", JSON.stringify(state.cart));
            toast.error(`Item ${payload} has been deleted.`);
        },
        addQty: (state, { payload }) => {
            state.cart = state.cart.filter((item) => {
                if (item.id === payload.id) {
                    item.qty = payload.qty;
                }
                return item;
            });
            localStorage.setItem("local-cart", JSON.stringify(state.cart));
        },
        reloadCart: (state, { payload }) => {
            // Chỉ tải từ localStorage, không gọi API trực tiếp từ reducer
            const localCart = JSON.parse(localStorage.getItem("local-cart"));
            if (localCart) {
                state.cart = localCart;
            }
        },
        updateCartFromAPI: (state, { payload }) => {
            if (payload && payload.items) {
                // Convert API cart items to Redux format
                const apiCartItems = payload.items.map(item => ({
                    id: item.productId?._id || item.productId,
                    title: item.name,
                    price: { max: item.price },
                    priceBeforeSale: item.priceBeforeSale,
                    onSale: item.onSale,
                    qty: item.quantity,
                    imgf: item.image?.split('/').pop() || 'placeholder.jpg'
                }));
                
                // Update Redux state
                state.cart = apiCartItems;
                
                // Also update localStorage for consistency
                localStorage.setItem("local-cart", JSON.stringify(apiCartItems));
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCartFromAPI.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCartFromAPI.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (action.payload && action.payload.items) {
                    // Convert API cart items to Redux format
                    const apiCartItems = action.payload.items.map(item => ({
                        id: item.productId?._id || item.productId,
                        title: item.name,
                        price: { max: item.price },
                        priceBeforeSale: item.priceBeforeSale,
                        onSale: item.onSale,
                        qty: item.quantity,
                        imgf: item.image?.split('/').pop() || 'placeholder.jpg'
                    }));
                    
                    // Update Redux state
                    state.cart = apiCartItems;
                    
                    // Also update localStorage for consistency
                    localStorage.setItem("local-cart", JSON.stringify(apiCartItems));
                }
            })
            .addCase(fetchCartFromAPI.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

export const { addCart, deleteCart, addQty, reloadCart, updateCartFromAPI } = shopSlice.actions;
export default shopSlice.reducer;
