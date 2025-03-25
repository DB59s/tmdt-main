import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// Async thunk to fetch wishlist data
export const fetchWishlist = createAsyncThunk(
    'wishlist/fetchWishlist',
    async (_, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) return [];

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}`, {
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist');
            }

            const data = await response.json();
            return data.success && data.data ? data.data.items : [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to add item to wishlist
export const addToWishlist = createAsyncThunk(
    'wishlist/addToWishlist',
    async (productId, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) throw new Error('User not logged in');

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}/items`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId })
            });

            if (!response.ok) {
                throw new Error('Failed to add item to wishlist');
            }

            const data = await response.json();
            return data.success && data.data ? data.data.items : [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to remove item from wishlist
export const removeFromWishlist = createAsyncThunk(
    'wishlist/removeFromWishlist',
    async (productId, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) throw new Error('User not logged in');

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}/items/${productId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to remove item from wishlist');
            }

            const data = await response.json();
            return { productId, items: data.success && data.data ? data.data.items : [] };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to check if item is in wishlist
export const checkWishlistItem = createAsyncThunk(
    'wishlist/checkItem',
    async (productId, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) return { productId, inWishlist: false };

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}/check/${productId}`, {
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to check wishlist item');
            }

            const data = await response.json();
            return { 
                productId, 
                inWishlist: data.success ? data.inWishlist : false 
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to clear the wishlist
export const clearWishlist = createAsyncThunk(
    'wishlist/clearWishlist',
    async (_, { rejectWithValue }) => {
        try {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) throw new Error('User not logged in');

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to clear wishlist');
            }

            return [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        wishlist: [],
        wishlistMap: {}, // Map for quick lookup by productId
        loading: false,
        error: null
    },
    reducers: {
        // Manual update for components that directly fetch data
        updateWishlist: (state, action) => {
            state.wishlist = action.payload;
            // Update the lookup map
            state.wishlistMap = {};
            action.payload.forEach(item => {
                const id = item.productId?._id || item.productId;
                if (id) {
                    state.wishlistMap[id] = true;
                }
            });
        },
        
        // Legacy reducers to maintain backward compatibility
        reloadWishlist: (state) => {
            const storedWishlist = localStorage.getItem("wishlist");
            const wishlistData = storedWishlist ? JSON.parse(storedWishlist) : [];
            state.wishlist = wishlistData;
        },
        addWishlist: (state, action) => {
            const isExist = state.wishlist.some(item => item.id === action.payload.product.id);
            if (!isExist) {
                state.wishlist.push({ ...action.payload.product, qty: 1 });
                localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
            }
        },
        deleteWishlist: (state, action) => {
            state.wishlist = state.wishlist.filter(item => item.id !== action.payload);
            localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
        },
        addQty: (state, action) => {
            const index = state.wishlist.findIndex(item => item.id === action.payload.id);
            if (index !== -1) {
                state.wishlist[index].qty = Number(action.payload.qty);
                localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch wishlist
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.wishlist = action.payload;
                // Update lookup map
                state.wishlistMap = {};
                action.payload.forEach(item => {
                    const id = item.productId?._id || item.productId;
                    if (id) {
                        state.wishlistMap[id] = true;
                    }
                });
                state.loading = false;
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch wishlist';
            })
            
            // Add to wishlist
            .addCase(addToWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToWishlist.fulfilled, (state, action) => {
                state.wishlist = action.payload;
                // Update lookup map
                state.wishlistMap = {};
                action.payload.forEach(item => {
                    const id = item.productId?._id || item.productId;
                    if (id) {
                        state.wishlistMap[id] = true;
                    }
                });
                state.loading = false;
            })
            .addCase(addToWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to add item to wishlist';
            })
            
            // Remove from wishlist
            .addCase(removeFromWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                const { productId, items } = action.payload;
                state.wishlist = items;
                // Update lookup map
                delete state.wishlistMap[productId];
                state.loading = false;
            })
            .addCase(removeFromWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to remove item from wishlist';
            })
            
            // Check wishlist item
            .addCase(checkWishlistItem.fulfilled, (state, action) => {
                const { productId, inWishlist } = action.payload;
                if (inWishlist) {
                    state.wishlistMap[productId] = true;
                } else {
                    delete state.wishlistMap[productId];
                }
            })
            
            // Clear wishlist
            .addCase(clearWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(clearWishlist.fulfilled, (state) => {
                state.wishlist = [];
                state.wishlistMap = {};
                state.loading = false;
            })
            .addCase(clearWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to clear wishlist';
            })
    }
});

export const { 
    addWishlist, 
    deleteWishlist, 
    addQty, 
    reloadWishlist,
    updateWishlist
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
