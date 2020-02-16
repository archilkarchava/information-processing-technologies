import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import Detail from './detail';
import Provider from './provider';

@Entity({ name: 'SP' })
@Check(`"Quantity" > 0`)
@Check(`"Price" > 0`)
@Check(`total_weight_less_than("Quantity", "PID", 1500)`)
export default class Supply {
  @PrimaryColumn({ name: 'SPID', type: 'int' })
  id: number;

  @Column({ name: 'Quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'Price', type: 'float' })
  price: number;

  @Column({ name: 'ShipDate', type: 'date', nullable: false })
  shipDate: Date;

  @ManyToOne(
    _type => Detail,
    detail => detail.supplies,
  )
  @JoinColumn({ name: 'PID' })
  detail: Detail;

  @ManyToOne(
    _type => Provider,
    provider => provider.supplies,
  )
  @JoinColumn({ name: 'SID' })
  provider: Provider;
}
