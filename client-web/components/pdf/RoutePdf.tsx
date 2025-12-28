import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Styles
// Styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        flexDirection: 'column',
        color: '#333',
    },
    // Hoja de Ruta Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#111',
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        backgroundColor: '#eee',
        padding: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#333',
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 24,
        alignItems: 'center',
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#ccc',
        padding: 6,
    },
    tableHeader: {
        backgroundColor: '#f4f4f4',
        fontWeight: 'bold',
        color: '#000',
    },
    text: {
        margin: 2,
        fontSize: 10,
    },
    bold: {
        fontWeight: 'bold',
        color: '#000',
    },

    // Remito Container (A4)
    remitoContainerPage: {
        padding: 20, // 20px padding around the whole A4 sheet
        fontFamily: 'Helvetica',
        flexDirection: 'column',
        height: '100%',
    },
    // Remito Section (Half Page)
    remitoSection: {
        flexGrow: 1, // Takes up available space (approx 50%)
        paddingVertical: 10,
        paddingHorizontal: 10,
        justifyContent: 'space-between', // Distribute content
    },
    cutLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#999',
        borderStyle: 'dashed',
        marginVertical: 5,
        width: '100%',
    },

    // Remito Content Styles
    remitoHeaderbox: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 0,
        marginBottom: 5,
        flexDirection: 'row',
        height: 90, // Slightly reduced height to fit 2 well
    },
    remitoLeftBox: {
        width: '55%',
        padding: 8,
        borderRightWidth: 1,
        borderColor: '#000',
        justifyContent: 'center',
    },
    remitoRightBox: {
        width: '45%',
        padding: 8,
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },
    clientBox: {
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 4,
        padding: 8,
        marginBottom: 5,
        backgroundColor: '#fff',
    },
    remitoTable: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#000',
        flex: 1, // Take remaining space for table
    },
    remitoHeaderCell: {
        backgroundColor: '#ddd',
        fontWeight: 'bold',
        fontSize: 10,
        padding: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        textAlign: 'center',
    },
    remitoCell: {
        padding: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
        fontSize: 10,
    },
    remitoFooter: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
        height: 60, // Fixed footer height
    },
    signBox: {
        borderWidth: 1,
        borderColor: '#999',
        borderStyle: 'dashed',
        borderRadius: 4,
        width: '48%',
        justifyContent: 'flex-end',
        padding: 5,
        height: '100%',
    },
});

interface PdfItem {
    producto: string;
    cantidad: number;
    unidad: string;
    totalHuevos?: number;
}

interface PdfOrder {
    pedidoId: number;
    cliente: string;
    direccion: string;
    items: PdfItem[];
    totalEstimado?: number;
}

interface PdfData {
    fecha: string;
    chofer: string;
    vehiculo: string;
    patente: string;
    acompanante?: string;
    pedidos: PdfOrder[];
    cargaTotal: PdfItem[];
}

interface RoutePdfProps {
    data: PdfData;
}

export const RoutePdf: React.FC<RoutePdfProps> = ({ data }) => {
    return (
        <Document>
            {/* ---------------- HOJA DE RUTA ---------------- */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Hoja de Ruta</Text>
                        <Text style={styles.subtitle}>Logística y Distribución</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.text}>Fecha: {data.fecha}</Text>
                        <Text style={styles.text}>{data.vehiculo} - {data.patente}</Text>
                        <Text style={styles.text}>Chofer: {data.chofer}</Text>
                    </View>
                </View>

                {/* Carga Total (Resumen del Chofer) */}
                <Text style={styles.sectionTitle}>Stock Total en Camioneta</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={{ ...styles.tableCol, width: '40%' }}>
                            <Text style={styles.bold}>Producto</Text>
                        </View>
                        <View style={{ ...styles.tableCol, width: '30%' }}>
                            <Text style={styles.bold}>Cantidad Cargada</Text>
                        </View>
                        <View style={{ ...styles.tableCol, width: '30%' }}>
                            <Text style={styles.bold}>Total Unidades</Text>
                        </View>
                    </View>
                    {data.cargaTotal.map((item, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <View style={{ ...styles.tableCol, width: '40%' }}>
                                <Text style={styles.text}>{item.producto}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '30%' }}>
                                <Text style={styles.text}>{item.cantidad} {item.unidad}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '30%' }}>
                                <Text style={styles.text}>{item.totalHuevos}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Listado de Visitas / Pedidos */}
                <Text style={styles.sectionTitle}>Itinerario de Entrega</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={{ ...styles.tableCol, width: '8%' }}>
                            <Text style={styles.bold}>Seq</Text>
                        </View>
                        <View style={{ ...styles.tableCol, width: '30%' }}>
                            <Text style={styles.bold}>Cliente</Text>
                        </View>
                        <View style={{ ...styles.tableCol, width: '32%' }}>
                            <Text style={styles.bold}>Dirección</Text>
                        </View>
                        <View style={{ ...styles.tableCol, width: '30%' }}>
                            <Text style={styles.bold}>Carga a Entregar</Text>
                        </View>
                    </View>
                    {data.pedidos.map((p, idx) => (
                        <View key={p.pedidoId} style={styles.tableRow}>
                            <View style={{ ...styles.tableCol, width: '8%' }}>
                                <Text style={styles.text}>{idx + 1}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '30%' }}>
                                <Text style={[styles.text, styles.bold]}>{p.cliente}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '32%' }}>
                                <Text style={styles.text}>{p.direccion || '-'}</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '30%' }}>
                                {p.items.map((i, k) => (
                                    <Text key={k} style={{ fontSize: 9, marginBottom: 2 }}>• {i.cantidad} {i.unidad} ({i.producto})</Text>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
                <Text style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', color: '#aaa', fontSize: 9 }}>
                    Documento interno de control - No válido como factura
                </Text>
            </Page>

            {/* ---------------- REMITOS (2 POR PAGINA A4) ---------------- */}
            {data.pedidos.map((pedido) => (
                <Page key={pedido.pedidoId} size="A4" style={styles.remitoContainerPage}>
                    <DeliveryNoteSection data={data} pedido={pedido} type="ORIGINAL" />

                    {/* Línea de corte */}
                    <View style={styles.cutLine} />

                    <DeliveryNoteSection data={data} pedido={pedido} type="DUPLICADO" />
                </Page>
            ))}
        </Document>
    );
};

// Seccion de Remito (Mitad de Hoja)
const DeliveryNoteSection = ({ data, pedido, type }: { data: PdfData, pedido: PdfOrder, type: string }) => (
    <View style={styles.remitoSection}>

        {/* Header Box */}
        <View style={styles.remitoHeaderbox}>
            <View style={styles.remitoLeftBox}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>AVÍCOLA SAN GABRIEL</Text>
                <Text style={{ fontSize: 9, marginTop: 4, color: '#444' }}>Distribución de Huevos y Productos de Granja</Text>
                <Text style={{ fontSize: 9, marginTop: 4 }}>Ruta Nacional 38, Km 41 1/2</Text>
                <Text style={{ fontSize: 9 }}>Molinari, Córdoba</Text>
            </View>

            {/* Letter "R" */}
            <View style={{ position: 'absolute', left: '53.5%', top: -1, zIndex: 10, transform: 'translateX(-50%)' }}>
                <View style={{ backgroundColor: 'white', borderWidth: 1, borderTopWidth: 0, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 24 }}>R</Text>
                </View>
                <View style={{ width: 1, height: 75, backgroundColor: 'black', position: 'absolute', left: 20, top: 40 }} />
            </View>

            <View style={styles.remitoRightBox}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, letterSpacing: 2 }}>REMITO</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 12 }}>Nº 0001-0000{pedido.pedidoId}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 5 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 10 }}>FECHA:</Text>
                    <Text style={{ fontSize: 10 }}>{data.fecha}</Text>
                </View>
            </View>
        </View>

        {/* Client Box */}
        <View style={styles.clientBox}>
            <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
                <Text style={{ width: 75, fontWeight: 'bold', fontSize: 10 }}>Señor(es):</Text>
                <Text style={{ flex: 1, fontSize: 11, paddingLeft: 5, borderBottomWidth: 1, borderBottomColor: '#ccc', borderStyle: 'dotted' }}>
                    {pedido.cliente}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ width: 75, fontWeight: 'bold', fontSize: 10 }}>Domicilio:</Text>
                <Text style={{ flex: 1, fontSize: 11, paddingLeft: 5, borderBottomWidth: 1, borderBottomColor: '#ccc', borderStyle: 'dotted' }}>
                    {pedido.direccion}
                </Text>
            </View>
        </View>

        {/* Items Table */}
        <View style={styles.remitoTable}>
            {/* Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1 }}>
                <Text style={[styles.remitoHeaderCell, { width: '15%' }]}>CANT.</Text>
                <Text style={[styles.remitoHeaderCell, { width: '20%' }]}>UNIDAD</Text>
                <Text style={[styles.remitoHeaderCell, { width: '65%', borderRightWidth: 0 }]}>DESCRIPCIÓN</Text>
            </View>

            {/* Rows */}
            {Array.from({ length: 6 }).map((_, idx) => {
                const item = pedido.items[idx];
                return (
                    <View key={idx} style={{ flexDirection: 'row', minHeight: 20, borderBottomWidth: 1, borderColor: '#eee' }}>
                        <Text style={[styles.remitoCell, { width: '15%', textAlign: 'center' }]}>
                            {item ? item.cantidad : ''}
                        </Text>
                        <Text style={[styles.remitoCell, { width: '20%', textAlign: 'center' }]}>
                            {item ? item.unidad : ''}
                        </Text>
                        <Text style={[styles.remitoCell, { width: '65%', borderRightWidth: 0 }]}>
                            {item ? item.producto : ''}
                        </Text>
                    </View>
                );
            })}
        </View>

        {/* Footer / Signatures */}
        <View style={styles.remitoFooter}>
            <View style={styles.signBox}>
                <Text style={{ textAlign: 'center', fontSize: 9 }}>Recibí Conforme (Firma y Aclaración)</Text>
            </View>
            <View style={[styles.signBox, { borderColor: '#fff' }]}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'right', color: '#999' }}>{type}</Text>
            </View>
        </View>

    </View>
);

export default RoutePdf;
