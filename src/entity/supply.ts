import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Detail from './detail';
import Provider from './provider';

@Entity({ name: 'SP' })
@Check(`"Quantity" > 0`)
@Check(`"Price" > 0`)
// @Check(`check_weight_constraint("Quantity", "PID", 1500)`)
export default class Supply {
  @PrimaryGeneratedColumn({ name: 'SPID', type: 'int' })
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
