import {
    BluetoothManager,
    BluetoothEscposPrinter
} from 'react-native-bluetooth-escpos-printer';
import { formatDateToDDMMAAAA, formatStringDateToDDMMAAAA } from './dateAndHour/dateHour';
import { MaskService } from 'react-native-masked-text';
import { removeAccentText } from './findTexts';
import ConDB from '../config/database';
import { TB_ConfigPrint } from '../database/DBTables';

export async function bluetoothEnable() {
    let isEnabled = false
    await BluetoothManager.isBluetoothEnabled()
        .then(async (enabled) => {
            // enabled ==> true /false
            isEnabled = await enabled
        }, (err) => {
            alert(err)
            isEnabled = false
        });

    return isEnabled
}

export async function enableBluetooth() {
    let data = []
    await BluetoothManager.enableBluetooth().then((r) => {
        if (r && r.length > 0) {
            for (var i = 0; i < r.length; i++) {
                try {
                    data.push(JSON.parse(r[i])); // NEED TO PARSE THE DEVICE INFORMATION
                } catch (e) {
                    //ignore
                }
            }
        }

    }, (err) => {
        alert(err)
    });

    return data
}

export async function listDispositivos() {
    let list = []
    await BluetoothManager.scanDevices()
        .then(async (s) => {
            list = JSON.parse(await s)
        }, (er) => {
            alert('error' + JSON.stringify(er));
        });

    return list
}

export async function verificarConexaoBluetooth() {
    const realm = await ConDB;
    let size = await realm.objects(TB_ConfigPrint.name).length;
    const configPrint = (size > 0 ? JSON.parse(JSON.stringify(Array.from(await realm.objects(TB_ConfigPrint.name))[0])) : null)

    if (configPrint != null) {
        BluetoothManager.connect(configPrint.mac)
    }
}

export async function printVenda(venda) {
    await setTimeout(async () => {
        await verificarConexaoBluetooth()
    }, 2000);

    const optionTitles = {
        encoding: 'UTF-8',
        codepage: 0,
    }

    try {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText(`${removeAccentText(venda.unidade ? venda.unidade.nomeFantasia : '')}\n\r`, optionTitles);
        await BluetoothEscposPrinter.printText(`${venda.unidade ? removeAccentText(venda.unidade.logradouro) : ''}, ${venda ? venda.unidade.numero : 0}\n\r`, { encoding: 'UTF-8' });
        await BluetoothEscposPrinter.printText(`${venda.unidade ? removeAccentText(venda.unidade.bairro) : ''} - ${venda ? removeAccentText(venda.unidade.cidade) : ''}/${venda ? venda.unidade.uf : ''}\n\r`, {});
        await BluetoothEscposPrinter.printText(`${venda.unidade ? (venda.unidade.telefone && venda.unidade.telefone.length >= 10 && venda.unidade.telefone.length <= 11 ? MaskService.toMask('cel-phone', venda.unidade.telefone, { format: 'BRL', withDDD: true }) : '') : ''}\n\r`, {});
        await BluetoothEscposPrinter.printText(`${venda.unidade ? venda.unidade.email : ''}\n\r`, {});
        await BluetoothEscposPrinter.printText(`\n\r`, {});

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Data: ${venda.dataVenda ? formatStringDateToDDMMAAAA(venda.dataVenda) : ''}\n\r`, {});
        await BluetoothEscposPrinter.printText(`Cliente: ${venda.cliente ? (venda.idCliente > 0 ? removeAccentText(venda.cliente.pessoa.nome) + ` (${venda.idCliente})` : 'Consumidor final') : ''}\n\r`, {});

         await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        if (venda.idCliente > 0) {
            await BluetoothEscposPrinter.printText(`Endereco: ${venda.cliente.pessoa.endereco[0].logradouro && String(venda.cliente.pessoa.endereco[0].logradouro) !== 'null' && String(venda.cliente.pessoa.endereco[0].logradouro) !== 'undefined' ? removeAccentText(venda.cliente.pessoa.endereco[0].logradouro) : ''}, ${venda.cliente.pessoa.endereco[0].cidade.mun && String(venda.cliente.pessoa.endereco[0].cidade.mun) !== 'undefined' && String(venda.cliente.pessoa.endereco[0].cidade.mun) !== 'null'? removeAccentText(venda.cliente.pessoa.endereco[0].cidade.mun) : ''}/${venda.cliente.pessoa.endereco[0].uf && String(venda.cliente.pessoa.endereco[0].uf) !=='null' && String(venda.cliente.pessoa.endereco[0].uf) !== 'undefined' ? removeAccentText(venda.cliente.pessoa.endereco[0].uf) : ''}\n\r`, {});
        }
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText(`Venda No: ${(!venda.id ? '' : venda.id)}\n\r\n\r`, optionTitles);

        await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        if (venda.itens) {
            let columnWidths = [5, 9, 5, 9, 7, 5];
            await BluetoothEscposPrinter.printColumn(columnWidths,
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ["Item", 'Produto', 'Qtd', 'Peso', 'Vlr Unit', 'Total'], {});
            await venda.itens.forEach(async (v) => {
                // console.log(`${v.item} - ${v.produto.nome} - ${v.qtd}/${v.pesoLiquido} - ${v.precoVenda} - ${v.total}`)
               // let isPeso = (String(v.produto.precoVenda.isValorSeraPorPeso) == 'true' | String(v.produto.undVenda.unidade.toLowerCase()) == 'kg')
                await BluetoothEscposPrinter.printText(`${String(v.item)} ${removeAccentText(v.produto.nome)} ${parseFloat(v.qtd)} ${MaskService.toMask('money', parseFloat((v.pesoLiquido ? v.pesoLiquido : 0)).toFixed((3)), { delimiter: '.', separator: ',', unit: '', precision: (3) })} ${MaskService.toMask('money', parseFloat(Number(v.precoVenda)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' })} ${MaskService.toMask('money', parseFloat(Number(v.total)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
            })
        }
        await BluetoothEscposPrinter.printText(`--------------------------------\n\r\n\r`, {});
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Subtotal:    `, {})
        await BluetoothEscposPrinter.printText(`${venda.subtotalSemPerdas ? MaskService.toMask('money', parseFloat(Number(venda.subtotalSemPerdas)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' }) : 0}\n\r`, optionTitles);
        await BluetoothEscposPrinter.printText(`Desconto com perdas:    `, {})
        await BluetoothEscposPrinter.printText(`${venda.totalDescontoPerdas ? MaskService.toMask('money', parseFloat(Number(venda.totalDescontoPerdas)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' }) : 0}\n\r`, optionTitles);
        await BluetoothEscposPrinter.printText(`Desconto:    `, {})
        await BluetoothEscposPrinter.printText(`${venda.desconto ? MaskService.toMask('money', parseFloat(Number(venda.desconto)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' }) : 0}\n\r`, optionTitles);
        await BluetoothEscposPrinter.printText(`Total:    `, {})
        await BluetoothEscposPrinter.printText(`${venda.total ? MaskService.toMask('money', parseFloat(Number(venda.total)).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' }) : 0}\n\r`, optionTitles);

        await BluetoothEscposPrinter.printText("\n\r\n\r", {});
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
        await BluetoothEscposPrinter.printText(`(Assinatura)`, {});
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {});
        await BluetoothEscposPrinter.printText("Dual PDV\n\r\n\r\n\r", {});
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    } catch (error) {
        console.log(error)
       // console.warn(error)
    }
}



export async function printComprovanteRecebimento(rec, unidade, cliente) {
    await setTimeout(async () => {
        await verificarConexaoBluetooth()
    }, 2000);
    let total = .0;
    // console.log(venda)
    const optionTitles = {
        encoding: 'UTF-8',
        codepage: 0,
        // widthtimes: 1,
        // heigthtimes: 1,
        // fonttype: 1
    }
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.nomeFantasia)}\n\r`, optionTitles);
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.logradouro)}, ${unidade.numero}\n\r`, { encoding: 'UTF-8' });
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.bairro)} - ${removeAccentText(unidade.cidade)}/${unidade.uf}\n\r`, {});
    await BluetoothEscposPrinter.printText(`${(unidade.telefone && unidade.telefone.length >= 10 && unidade.telefone.length <= 11 ? MaskService.toMask('cel-phone', unidade.telefone, { format: 'BRL', withDDD: true }) : '')}\n\r`, {});
    await BluetoothEscposPrinter.printText(`${unidade.email}\n\r`, {});
    await BluetoothEscposPrinter.printText(`\n\r`, {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Data: ${formatDateToDDMMAAAA(new Date())}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Cliente: ${(cliente && cliente.id > 0 ? removeAccentText(cliente.pessoa.nome) + ` (${cliente.id})` : 'Consumidor final')}\n\r`, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`Comprovante de recebimento\n\r\n\r`, optionTitles);

    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    let columnWidths = [9, 9];
    await BluetoothEscposPrinter.printColumn(columnWidths,
        [BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.LEFT],
        ["Valor", 'Especie'], {});
    await rec.forEach(async (v) => {
        total += v.valor;
        // console.log(`Tabela de Preço por Kg? ${v.produto.precoVenda.valorSeraPorPeso}\nUnd Venda: ${v.produto.undVenda.unidade}`)
        await BluetoothEscposPrinter.printText(`${MaskService.toMask('money', parseFloat(v.valor).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$ ', precision: 2 })} ${v.especie}\n\r`, {});
    })
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r\n\r`, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
    await BluetoothEscposPrinter.printText(`Total:    `, {})
    await BluetoothEscposPrinter.printText(`${MaskService.toMask('money', parseFloat(total).toFixed(2), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, optionTitles);

    await BluetoothEscposPrinter.printText("\n\r\n\r", {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    await BluetoothEscposPrinter.printText(`(Assinatura)`, {});
    await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.printText("Dual PDV\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
}

export async function printFechamentoCaixa(caixa, unidade) {
    await setTimeout(async () => {
        await verificarConexaoBluetooth()
    }, 2000);
    let total = .0;
    // console.log(venda)
    const optionTitles = {
        encoding: 'UTF-8',
        codepage: 0,
        // widthtimes: 1,
        // heigthtimes: 1,
        // fonttype: 1
    }
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.nomeFantasia)}\n\r`, optionTitles);
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.logradouro)}, ${unidade.numero}\n\r`, { encoding: 'UTF-8' });
    await BluetoothEscposPrinter.printText(`${removeAccentText(unidade.bairro)} - ${removeAccentText(unidade.cidade)}/${unidade.uf}\n\r`, {});
    await BluetoothEscposPrinter.printText(`${(unidade.telefone && unidade.telefone.length >= 10 && unidade.telefone.length <= 11 ? MaskService.toMask('cel-phone', unidade.telefone, { format: 'BRL', withDDD: true }) : '')}\n\r`, {});
    await BluetoothEscposPrinter.printText(`${unidade.email}\n\r`, {});
    await BluetoothEscposPrinter.printText(`\n\r`, {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Data: ${formatDateToDDMMAAAA(new Date())}\n\n\r`, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`Fechamento de Caixa No ${caixa.idMovimentacaoCaixa} \n\r\n\r`, optionTitles);
    await BluetoothEscposPrinter.printText(`--------------------------------\n\n\r`, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Saldo Inicial: ${MaskService.toMask('money', parseFloat(caixa.saldoInicial), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Dinheiro: ${MaskService.toMask('money', parseFloat(caixa.saldoInicialDinheiro), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Cheque: ${MaskService.toMask('money', parseFloat(caixa.saldoInicialCheque), { delimiter: '.', separator: ',', unit: 'R$' })}\n\n\r`, {});

    await BluetoothEscposPrinter.printText(`Arrecadado: ${MaskService.toMask('money', parseFloat(caixa.totalEntradaFechamento), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Dinheiro: ${MaskService.toMask('money', parseFloat(caixa.totalEntradaFechamentoDinheiro), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Cheque: ${MaskService.toMask('money', parseFloat(caixa.totalEntradaFechamentoCheque), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Banco: ${MaskService.toMask('money', parseFloat(caixa.totalEntradaFechamentoBanco), { delimiter: '.', separator: ',', unit: 'R$' })}\n\n\r`, {});

    await BluetoothEscposPrinter.printText(`Saídas: ${MaskService.toMask('money', parseFloat(caixa.totalSaidaFechamento), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Dinheiro: ${MaskService.toMask('money', parseFloat(caixa.totalSaidaFechamentoDinheiro), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Cheque: ${MaskService.toMask('money', parseFloat(caixa.totalSaidaFechamentoCheque), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`....Banco: ${MaskService.toMask('money', parseFloat(caixa.totalSaidaFechamentoBanco), { delimiter: '.', separator: ',', unit: 'R$' })}\n\n\r`, {});

    await BluetoothEscposPrinter.printText(`Total Dinheiro: ${MaskService.toMask('money', parseFloat(caixa.totalDinheiro), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Total Cheque: ${MaskService.toMask('money', parseFloat(caixa.totalCheque), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Total Banco: ${MaskService.toMask('money', parseFloat(caixa.totalBanco), { delimiter: '.', separator: ',', unit: 'R$' })}\n\r`, {});


    await BluetoothEscposPrinter.printText("\n\r\n\r", {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    await BluetoothEscposPrinter.printText(`(Assinatura)`, {});
    await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.printText("Dual PDV\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

}