import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AutoUnsubscribe} from "ngx-auto-unsubscribe";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {ApiService} from "../../../services/api.service";
import {ToastService} from "../../../services/toast.service";
import {Router} from "@angular/router";
import {DialogHelperService} from "../../../services/dialog-helper.service";
import {TranslateService} from "@ngx-translate/core";


@AutoUnsubscribe()
@Component({
    selector: 'app-access-oauth2',
    templateUrl: './access-oauth2.component.html',
    styleUrls: ['./access-oauth2.component.scss']
})
export class AccessOauth2Component implements OnInit, OnDestroy {
    displayedColumns: string[] = ['name', 'client_id', 'client_secret', 'redirect_uris', 'hash_secret', 'tags', 'actions'];
    dataSource: MatTableDataSource<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    data;
    loading = false;
    filter = '';
    consumers = {};

    constructor(private api: ApiService, private toast: ToastService, private route: Router, private dialogHelper: DialogHelperService,
                private translate: TranslateService) {
    }

    ngOnInit(): void {
        // Aquí para que no error de ExpressionChangedAfterItHasBeenCheckedError
        this.loading = true;
        this.getOAuthApps();
        this.getConsumers();
    }

    ngOnDestroy(): void {
    }

    /**
     * Recarga los datos de consumidores
     */
    reloadData(cleanFilter = false) {
        this.loading = true;
        if (cleanFilter) {
            this.filter = '';
        }

        this.getOAuthApps();
        this.getConsumers();
    }

    /**
     * Muestra u oculta la api key
     * @param key Clave
     * @param show Mostrar u ocultar
     */
    showKey(key, show) {
        if (key === null) {
            return '';
        }

        if (!show) {
            key = key.substring(0, 5).padEnd(key.length, '*');
        }
        return key;
    }

    /**
     * Obtiene las API key
     */
    getOAuthApps() {
        this.api.getOAuthApp()
            .subscribe({
                next: (value) => {
                    this.dataSource = new MatTableDataSource(value['data']);
                    this.dataSource.paginator = this.paginator;
                    // Accessor para poder ordenar por la columna consumer, cuyo campo para ordenar está anidado
                    // por defecto no ordena en campos anidados
                    this.dataSource.sortingDataAccessor = (item, property) => {
                        switch (property) {
                            case 'consumer':
                                return item.consumer.id;
                            default:
                                return item[property];
                        }
                    };
                    this.dataSource.sort = this.sort;
                },
                error: () => this.toast.error('error.node_connection'),
                complete: () => {
                    this.loading = false;
                    this.applyFilter();
                }
            });
    }

    /**
     * Obtiene la información del nodo
     */
    getConsumers() {
        this.api.getConsumers()
            .subscribe({
                next: (res) => {
                    // Recojo los consumidores
                    res['data'].forEach(consumer => {
                        this.consumers[consumer.id] = consumer.username;
                    });
                },
                error: () => this.toast.error('error.node_connection')
            });
    }

    /**
     * Aplica los filtros en los datos de la tabla
     */
    applyFilter() {
        const filterValue = this.filter;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    /**
     * Borra el elemento seleccionado
     * @param select Elemento a borrar
     */
    delete(select) {
        this.dialogHelper.deleteElement({
            id: select.id,
            consumerId: select.consumer.id,
            name: select.name + ' [' + this.translate.instant('text.consumer') + ' ' + this.consumers[select.consumer.id] + ']'
        }, 'oauth2')
            .then(() => {
                this.reloadData();
            })
            .catch(error => {
            });
    }


    parseLines(redirect_uris: any) {
        let out = redirect_uris;
        if (redirect_uris) {
            out = redirect_uris.join('\n');
        }
        return out;
    }
}