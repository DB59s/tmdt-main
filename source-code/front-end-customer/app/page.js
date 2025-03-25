import Layout from "@/components/layout/Layout"
import Category from "@/components/sections/Category"
import DealProduct1 from "@/components/sections/DealProduct1"
import Product1 from "@/components/sections/Product1"
import Shop from "@/components/sections/Shop"
import Slider1 from "@/components/sections/Slider1"
import OnSaleProducts from "@/components/sections/OnSaleProducts"

export const metadata = {
  title: 'Ninico - Minimal NextJS React Template',
  description: 'Generated by create next app',
}
export default function Home() {
    return (
        <>
            <Layout headerStyle={1} footerStyle={1}>
                <Slider1 />
                <Category />
                <Product1 />
                <OnSaleProducts />
                {/* <DealProduct1 /> */}
                <Shop />
            </Layout>
        </>
    )
}