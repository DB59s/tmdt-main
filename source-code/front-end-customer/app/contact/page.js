import Layout from "@/components/layout/Layout"
import Link from "next/link"

export default function Contact() {
    return (
        <>
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Liên Hệ">
                <div>
                    <section className="contact-area pt-80 pb-80">
                        <div className="container">
                            <div className="row align-items-center">
                                <div className="col-lg-6 col-12">
                                    <div className="tpcontact__right mb-40">
                                        <div className="tpcontact__shop mb-40" style={{ 
                                            padding: "40px",
                                            borderRadius: "15px",
                                            boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.08)",
                                            backgroundColor: "#fff"
                                        }}>
                                            <h3 className="mb-30" style={{ 
                                                fontSize: "28px", 
                                                fontWeight: "700",
                                                color: "#333",
                                                borderBottom: "2px solid #ff4a17",
                                                paddingBottom: "15px"
                                            }}>Thông Tin Liên Hệ</h3>
                                            <div className="tpshop__info">
                                                <ul style={{ listStyle: "none", padding: 0 }}>
                                                    <li style={{ 
                                                        display: "flex", 
                                                        marginBottom: "25px", 
                                                        alignItems: "flex-start" 
                                                    }}>
                                                        <i className="fal fa-map-marker-alt" style={{ 
                                                            fontSize: "22px", 
                                                            color: "#ff4a17", 
                                                            marginRight: "15px",
                                                            marginTop: "5px"
                                                        }} />
                                                        <div>
                                                            <h5 style={{ fontWeight: "600", marginBottom: "5px", color: "#333" }}>Địa Chỉ</h5>
                                                            <p style={{ color: "#666", margin: 0, lineHeight: "1.6" }}>
                                                                Số 10, Đường Trần Phú, Hà Đông, Hà Nội
                                                            </p>
                                                        </div>
                                                    </li>
                                                    <li style={{ 
                                                        display: "flex", 
                                                        marginBottom: "25px", 
                                                        alignItems: "flex-start" 
                                                    }}>
                                                        <i className="fal fa-phone" style={{ 
                                                            fontSize: "22px", 
                                                            color: "#ff4a17", 
                                                            marginRight: "15px",
                                                            marginTop: "5px"
                                                        }} />
                                                        <div>
                                                            <h5 style={{ fontWeight: "600", marginBottom: "5px", color: "#333" }}>Số Điện Thoại</h5>
                                                            <Link href="tel:0919534982" style={{ 
                                                                color: "#666", 
                                                                textDecoration: "none",
                                                                transition: "color 0.3s",
                                                                display: "block",
                                                                fontSize: "16px"
                                                            }}>
                                                                0919 534 982
                                                            </Link>
                                                        </div>
                                                    </li>
                                                    <li style={{ 
                                                        display: "flex", 
                                                        marginBottom: "25px", 
                                                        alignItems: "flex-start" 
                                                    }}>
                                                        <i className="fal fa-clock" style={{ 
                                                            fontSize: "22px", 
                                                            color: "#ff4a17", 
                                                            marginRight: "15px",
                                                            marginTop: "5px"
                                                        }} />
                                                        <div>
                                                            <h5 style={{ fontWeight: "600", marginBottom: "5px", color: "#333" }}>Giờ Mở Cửa</h5>
                                                            <p style={{ color: "#666", margin: 0, lineHeight: "1.6" }}>
                                                                8:00 sáng - 5:00 chiều, mọi ngày trong tuần
                                                            </p>
                                                        </div>
                                                    </li>
                                                    <li style={{ 
                                                        display: "flex", 
                                                        marginBottom: "0", 
                                                        alignItems: "flex-start" 
                                                    }}>
                                                        <i className="fal fa-envelope" style={{ 
                                                            fontSize: "22px", 
                                                            color: "#ff4a17", 
                                                            marginRight: "15px",
                                                            marginTop: "5px"
                                                        }} />
                                                        <div>
                                                            <h5 style={{ fontWeight: "600", marginBottom: "5px", color: "#333" }}>Email</h5>
                                                            <Link href="mailto:vuduy050903@gmail.com" style={{ 
                                                                color: "#666", 
                                                                textDecoration: "none",
                                                                transition: "color 0.3s",
                                                                display: "block",
                                                                fontSize: "16px"
                                                            }}>
                                                                vuduy050903@gmail.com
                                                            </Link>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="tpcontact__support" style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "15px" 
                                        }}>
                                            <Link href="tel:0919534982" style={{ 
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "20px 25px",
                                                backgroundColor: "#ff4a17",
                                                color: "#fff",
                                                borderRadius: "10px",
                                                textDecoration: "none",
                                                fontWeight: "600",
                                                transition: "all 0.3s ease",
                                                boxShadow: "0 5px 15px rgba(255, 74, 23, 0.2)"
                                            }}>
                                                Gọi Ngay <i className="fal fa-headphones" style={{ fontSize: "20px" }} />
                                            </Link>
                                            <Link target="_blank" href="https://www.google.com/maps/place/Tr%E1%BA%A7n+Ph%C3%BA,+H%C3%A0+%C4%90%C3%B4ng,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam" style={{ 
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "20px 25px",
                                                backgroundColor: "#f5f5f5",
                                                color: "#333",
                                                borderRadius: "10px",
                                                textDecoration: "none",
                                                fontWeight: "600",
                                                transition: "all 0.3s ease",
                                                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)"
                                            }}>
                                                Xem Bản Đồ <i className="fal fa-map-marker-alt" style={{ fontSize: "20px", color: "#ff4a17" }} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-12">
                                    <div className="tpcontact__info-box" style={{ 
                                        backgroundColor: "#f9f9f9",
                                        padding: "40px",
                                        borderRadius: "15px",
                                        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)"
                                    }}>
                                        <div className="tpcontact__info mb-40">
                                            <h3 style={{ 
                                                fontSize: "28px", 
                                                fontWeight: "700", 
                                                color: "#333",
                                                marginBottom: "20px"
                                            }}>Bạn Cần Hỗ Trợ?</h3>
                                            <p style={{ 
                                                fontSize: "16px", 
                                                lineHeight: "1.8", 
                                                color: "#666",
                                                marginBottom: "30px"
                                            }}>
                                                Nếu bạn có bất kỳ câu hỏi hoặc vấn đề nào cần giải đáp, chúng tôi luôn sẵn sàng hỗ trợ bạn qua các kênh sau:
                                            </p>
                                            
                                            <div className="contact-options">
                                                <div className="contact-option-item" style={{ 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    padding: "20px",
                                                    backgroundColor: "#fff",
                                                    borderRadius: "10px",
                                                    marginBottom: "20px",
                                                    boxShadow: "0 3px 10px rgba(0,0,0,0.03)"
                                                }}>
                                                    <div style={{ 
                                                        width: "60px", 
                                                        height: "60px", 
                                                        backgroundColor: "rgba(255, 74, 23, 0.1)", 
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        marginRight: "20px"
                                                    }}>
                                                        <i className="fal fa-phone-alt" style={{ fontSize: "24px", color: "#ff4a17" }}></i>
                                                    </div>
                                                    <div>
                                                        <h5 style={{ fontWeight: "600", marginBottom: "8px" }}>Gọi Điện Trực Tiếp</h5>
                                                        <p style={{ margin: 0, color: "#666" }}>
                                                            Liên hệ với chúng tôi qua số <strong>0919 534 982</strong> trong giờ làm việc.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="contact-option-item" style={{ 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    padding: "20px",
                                                    backgroundColor: "#fff",
                                                    borderRadius: "10px",
                                                    boxShadow: "0 3px 10px rgba(0,0,0,0.03)"
                                                }}>
                                                    <div style={{ 
                                                        width: "60px", 
                                                        height: "60px", 
                                                        backgroundColor: "rgba(255, 74, 23, 0.1)", 
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        marginRight: "20px"
                                                    }}>
                                                        <i className="far fa-comments" style={{ fontSize: "24px", color: "#ff4a17" }}></i>
                                                    </div>
                                                    <div>
                                                        <h5 style={{ fontWeight: "600", marginBottom: "8px" }}>Chat Trực Tuyến</h5>
                                                        <p style={{ margin: 0, color: "#666" }}>
                                                            Sử dụng tính năng chat bubble ở góc màn hình để được tư vấn ngay lập tức.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="contact-note" style={{ 
                                                marginTop: "30px", 
                                                padding: "20px", 
                                                backgroundColor: "rgba(255, 74, 23, 0.08)",
                                                borderRadius: "10px",
                                                borderLeft: "4px solid #ff4a17"
                                            }}>
                                                <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#666" }}>
                                                    <i className="far fa-info-circle" style={{ marginRight: "10px", color: "#ff4a17" }}></i>
                                                    Chúng tôi sẽ phản hồi trong thời gian sớm nhất. Cảm ơn bạn đã liên hệ với chúng tôi!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <div className="map-area">
                        <div className="tpshop__location-map" style={{ height: "450px" }}>
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3725.4870017267604!2d105.77232807596355!3d20.97526078046946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ad2a8f9ee96f%3A0x6d5e2e201866b7aa!2zVHLhuqduIFBow7osIEjDoCDEkMO0bmcsIEjDoCBO4buZaSwgVmlldG5hbQ!5e0!3m2!1sen!2s!4v1689140348675!5m2!1sen!2s" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0, borderRadius: "15px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }} 
                                allowFullScreen 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}