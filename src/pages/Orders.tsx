import { useUserOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InvoiceModal from '@/components/InvoiceModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Calendar, Package, FileText, Eye, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { Order } from '@/types';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import OrderPaymentStatus from '@/components/OrderPaymentStatus';
import PaymentProofUploader from '@/components/PaymentProofUploader';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { data: orders, isLoading, error } = useUserOrders(user?.uid || '');
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [selectedPaymentProofUrl, setSelectedPaymentProofUrl] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Add manual refresh function instead of relying on automatic refetching
  const handleRefresh = () => {
    if (user?.uid) {
      queryClient.invalidateQueries({ queryKey: ['orders', 'user', user.uid] });
    }
  };

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShowInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const handleViewPaymentProof = (url: string) => {
    setSelectedPaymentProofUrl(url);
    setShowPaymentProof(true);
  };

  const handleUploadPaymentProof = (orderId: string) => {
    setShowUploader(orderId);
  };

  const handleUploadSuccess = () => {
    setShowUploader(null);
    handleRefresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'processing':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'processing':
        return 'text-purple-600';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPaymentStatus = (order: Order) => {
    if (order.payment_status) {
      return order.payment_status;
    }
    
    // Fallback logic based on order status
    if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'completed') {
      return 'verified';
    } else if (order.status === 'cancelled') {
      return 'rejected';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('orders.title')}</h1>
                <p className="text-gray-600">{t('orders.subtitle')}</p>
              </div>
            </div>
            
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> 
              {t('orders.refresh')}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Terjadi Kesalahan
                </h3>
                <p className="text-gray-600 mb-4">
                  Tidak dapat memuat riwayat pesanan. Silakan coba lagi nanti.
                </p>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                >
                  Muat Ulang
                </Button>
              </CardContent>
            </Card>
          ) : !orders || orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  {t('orders.noOrders')}
                </h3>
                <p className="text-gray-600 mb-8">
                  {t('orders.noOrdersMessage')}
                </p>
                <a
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {t('cart.startShopping')}
                </a>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order: Order) => (
                <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{t('orders.orderNumber')}{order.id.slice(-8).toUpperCase()}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.created_at)}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusBadgeVariant(order.status || 'pending')}>
                          {getStatusText(order.status || 'pending')}
                        </Badge>
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(order.total_price)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items Summary - Show ALL items */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">{t('orders.orderSummary')}</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={item.image_url || '/placeholder.svg'}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-sm">{item.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.quantity} x {formatPrice(item.price)}
                                  </p>
                                  {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                    <p className="text-xs text-gray-500">
                                      Varian: {Object.entries(item.selectedVariants).map(([type, value]) => `${type}: ${value}`).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="font-medium text-sm">
                                {formatPrice(item.quantity * item.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Info Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{t('orders.shippingInfo')}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">{t('orders.name')}</span> {order.customer_info.name}</p>
                          <p><span className="font-medium">{t('orders.address')}</span> {order.customer_info.address}</p>
                          <p><span className="font-medium">{t('orders.prefecture')}</span> {order.customer_info.prefecture}</p>
                          <p><span className="font-medium">{t('orders.postalCode')}</span> {order.customer_info.postal_code}</p>
                        </div>
                      </div>

                      {/* Payment Status Section */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-3">{t('orders.paymentInfo')}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-blue-700">
                              {t('payment.method')}: {order.customer_info.payment_method || 'Tidak tersedia'}
                            </p>
                            <OrderPaymentStatus 
                              status={getPaymentStatus(order)} 
                              paymentProofUrl={order.payment_proof_url}
                              onViewProof={() => order.payment_proof_url && handleViewPaymentProof(order.payment_proof_url)}
                            />
                          </div>
                          
                          {!order.payment_proof_url && order.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUploadPaymentProof(order.id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {t('buttons.uploadProof')}
                            </Button>
                          )}
                        </div>

                        {/* Payment Proof Uploader */}
                        {showUploader === order.id && (
                          <div className="mt-4 border-t border-blue-200 pt-4">
                            <PaymentProofUploader 
                              orderId={order.id} 
                              onSuccess={handleUploadSuccess}
                            />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <Button 
                          onClick={() => handleShowInvoice(order)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {t('buttons.viewInvoice')}
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleShowInvoice(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('buttons.orderDetails')}
                        </Button>
                      </div>

                      {/* Status Timeline */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-400' :
                            order.status === 'confirmed' ? 'bg-blue-400' :
                            order.status === 'processing' ? 'bg-purple-400' :
                            order.status === 'completed' ? 'bg-green-400' :
                            'bg-red-400'
                          }`}></div>
                          <span className={`text-sm font-medium ${getStatusColor(order.status || 'pending')}`}>
                            {t('orders.status')} {getStatusText(order.status || 'pending')}
                          </span>
                        </div>
                        {order.status === 'pending' && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">
                            {t('orders.pending')}
                          </p>
                        )}
                        {order.status === 'confirmed' && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">
                            {t('orders.confirmed')}
                          </p>
                        )}
                        {order.status === 'completed' && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">
                            {t('orders.completed')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}

      {/* Payment Proof Modal */}
      {showPaymentProof && selectedPaymentProofUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setShowPaymentProof(false)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPaymentProof(false)}
              className="absolute -top-12 right-0 text-white bg-black bg-opacity-50 hover:bg-opacity-70"
            >
              ✕ Close
            </Button>
            <img 
              src={selectedPaymentProofUrl} 
              alt="Bukti Pembayaran" 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Orders;