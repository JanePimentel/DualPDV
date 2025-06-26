
import React from "react";
import { connect } from "react-redux";
import {TB_ContasAReceber} from '../database/DBTables';
import ConDB from '../config/database';

export async function gravaAlteracoesContasAReceber(v) {
    /** * Grava as modificações no banco local de contas a receber*/
    const realm = await ConDB;
    realm.write(() => {
        let contas = realm.objects(TB_ContasAReceber.name);
        for (let itemcr of contas) {
            let item = JSON.parse(itemcr.json);
            if (item.titulo == v.idTituloContaAReceber && item.idConta == v.idContaAReceber) {
                item.valorAberto -= v.valor;
                itemcr.json = JSON.stringify(item);
               realm.create(TB_ContasAReceber.name, itemcr, true)
                break;
            }
        }
    })
}


/*  async function verificaCaixa() {

    try {
        let sizeCaixa = realm.objects(TB_Caixa.name).length;
        let caixaTB = realm.objects(TB_Caixa.name);
        if (sizeCaixa > 0) {
            for (let i = 0; i < caixaTB.length; i++) {
                let c = await JSON.parse(caixaTB[i].json);
                if (String(c.aberto) === 'true') {

                    return c;
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
} */
